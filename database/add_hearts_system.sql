-- Add hearts system to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_hearts INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_heart_lost_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hearts_lost_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS heart_refill_time TIMESTAMP WITH TIME ZONE;

-- Create hearts transactions table for tracking
CREATE TABLE IF NOT EXISTS heart_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for gain, negative for loss
    reason TEXT NOT NULL, -- 'quiz_failed', 'time_refill', 'purchase', 'daily_refill'
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_heart_transactions_user_id ON heart_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_heart_transactions_created_at ON heart_transactions(created_at);

-- Function to regenerate hearts over time (1 heart every 1 hour)
CREATE OR REPLACE FUNCTION regenerate_hearts()
RETURNS TRIGGER AS $$
BEGIN
    -- If user has less than max hearts and enough time has passed
    IF NEW.hearts < NEW.max_hearts AND
       (NEW.heart_refill_time IS NULL OR NEW.heart_refill_time < CURRENT_TIMESTAMP) THEN

        -- Calculate how many hearts to regenerate (1 per hour since last refill)
        DECLARE
            hours_passed INTEGER;
            hearts_to_add INTEGER;
        BEGIN
            IF NEW.heart_refill_time IS NOT NULL THEN
                hours_passed := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.heart_refill_time)) / 3600;
                hearts_to_add := LEAST(hours_passed, NEW.max_hearts - NEW.hearts);

                IF hearts_to_add > 0 THEN
                    NEW.hearts := NEW.hearts + hearts_to_add;
                    NEW.heart_refill_time := CURRENT_TIMESTAMP;
                END IF;
            ELSE
                NEW.heart_refill_time := CURRENT_TIMESTAMP;
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for heart regeneration on user update
DROP TRIGGER IF EXISTS trigger_regenerate_hearts ON users;
CREATE TRIGGER trigger_regenerate_hearts
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION regenerate_hearts();

-- Function to check and refill hearts (can be called periodically)
CREATE OR REPLACE FUNCTION check_heart_refill(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_hearts INTEGER;
    max_hearts_allowed INTEGER;
    last_refill TIMESTAMP WITH TIME ZONE;
    hours_since_refill INTEGER;
    hearts_to_add INTEGER;
BEGIN
    -- Get current user heart status
    SELECT hearts, max_hearts, heart_refill_time
    INTO current_hearts, max_hearts_allowed, last_refill
    FROM users
    WHERE id = p_user_id;

    -- If already at max hearts, nothing to do
    IF current_hearts >= max_hearts_allowed THEN
        RETURN current_hearts;
    END IF;

    -- Calculate hours since last refill (or set to 24 if never refilled)
    IF last_refill IS NULL THEN
        hours_since_refill := 24;
    ELSE
        hours_since_refill := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_refill)) / 3600;
    END IF;

    -- Add 1 heart per hour, up to max
    hearts_to_add := LEAST(FLOOR(hours_since_refill), max_hearts_allowed - current_hearts);

    IF hearts_to_add > 0 THEN
        UPDATE users
        SET hearts = hearts + hearts_to_add,
            heart_refill_time = CURRENT_TIMESTAMP
        WHERE id = p_user_id;

        -- Log the transaction
        INSERT INTO heart_transactions (user_id, amount, reason)
        VALUES (p_user_id, hearts_to_add, 'time_refill');

        RETURN current_hearts + hearts_to_add;
    END IF;

    RETURN current_hearts;
END;
$$ LANGUAGE plpgsql;

-- Function to lose a heart
CREATE OR REPLACE FUNCTION lose_heart(p_user_id UUID, p_quiz_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    current_hearts INTEGER;
    result JSON;
BEGIN
    -- Check and potentially refill hearts first
    PERFORM check_heart_refill(p_user_id);

    -- Get current hearts
    SELECT hearts INTO current_hearts
    FROM users
    WHERE id = p_user_id;

    IF current_hearts <= 0 THEN
        -- No hearts left
        result := json_build_object(
            'success', false,
            'hearts_remaining', 0,
            'message', 'No hearts remaining! Wait for refill or complete daily challenges.'
        );
    ELSE
        -- Deduct a heart
        UPDATE users
        SET hearts = hearts - 1,
            last_heart_lost_at = CURRENT_TIMESTAMP,
            hearts_lost_today = hearts_lost_today + 1
        WHERE id = p_user_id;

        -- Log the transaction
        INSERT INTO heart_transactions (user_id, amount, reason, quiz_id)
        VALUES (p_user_id, -1, 'quiz_failed', p_quiz_id);

        result := json_build_object(
            'success', true,
            'hearts_remaining', current_hearts - 1,
            'message', CASE
                WHEN current_hearts - 1 = 0 THEN 'Last heart lost! No more attempts until refill.'
                WHEN current_hearts - 1 = 1 THEN 'Careful! Only 1 heart remaining!'
                ELSE 'Heart lost! ' || (current_hearts - 1) || ' hearts remaining.'
            END
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Daily reset function (can be called by a cron job)
CREATE OR REPLACE FUNCTION daily_hearts_reset()
RETURNS void AS $$
BEGIN
    -- Reset daily hearts lost counter
    UPDATE users
    SET hearts_lost_today = 0;

    -- Bonus: Give users with 0 hearts a free heart as daily bonus
    UPDATE users
    SET hearts = 1
    WHERE hearts = 0;

    -- Log daily bonus transactions
    INSERT INTO heart_transactions (user_id, amount, reason)
    SELECT id, 1, 'daily_bonus'
    FROM users
    WHERE hearts = 1;  -- Just got the bonus
END;
$$ LANGUAGE plpgsql;

-- Add sample data for testing
UPDATE users
SET hearts = 5,
    max_hearts = 5,
    heart_refill_time = CURRENT_TIMESTAMP
WHERE hearts IS NULL;