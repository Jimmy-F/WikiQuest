// Predefined quiz questions for each article
// Each article has 4-5 questions, need 75% correct to pass, 100% for golden

export const QUIZ_QUESTIONS: { [article: string]: any[] } = {
  // Stage 1: First Steps
  'Water': [
    {
      question: 'What is the chemical formula for water?',
      options: ['H2O', 'CO2', 'O2', 'N2O'],
      correct: 0,
      explanation: 'Water is composed of two hydrogen atoms and one oxygen atom (H2O).'
    },
    {
      question: 'At what temperature does water freeze at sea level?',
      options: ['100°C', '0°C', '32°C', '-10°C'],
      correct: 1,
      explanation: 'Water freezes at 0°C (32°F) at sea level under normal atmospheric pressure.'
    },
    {
      question: 'What percentage of Earth\'s surface is covered by water?',
      options: ['50%', '60%', '71%', '85%'],
      correct: 2,
      explanation: 'Approximately 71% of Earth\'s surface is covered by water.'
    },
    {
      question: 'Which property of water allows ice to float?',
      options: ['Higher density when frozen', 'Lower density when frozen', 'Surface tension', 'Viscosity'],
      correct: 1,
      explanation: 'Ice floats because water expands when it freezes, making ice less dense than liquid water.'
    }
  ],

  'Air': [
    {
      question: 'What is the most abundant gas in Earth\'s atmosphere?',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
      correct: 2,
      explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.'
    },
    {
      question: 'What percentage of Earth\'s atmosphere is oxygen?',
      options: ['21%', '50%', '78%', '10%'],
      correct: 0,
      explanation: 'Oxygen comprises approximately 21% of Earth\'s atmosphere.'
    },
    {
      question: 'What layer of the atmosphere do we live in?',
      options: ['Stratosphere', 'Mesosphere', 'Troposphere', 'Thermosphere'],
      correct: 2,
      explanation: 'The troposphere is the lowest layer of Earth\'s atmosphere where we live and weather occurs.'
    },
    {
      question: 'What happens to air pressure as altitude increases?',
      options: ['Increases', 'Decreases', 'Stays the same', 'Doubles'],
      correct: 1,
      explanation: 'Air pressure decreases with altitude because there is less air above pushing down.'
    }
  ],

  'Fire': [
    {
      question: 'What three things does fire need to exist (fire triangle)?',
      options: ['Heat, Fuel, Oxygen', 'Water, Air, Earth', 'Wood, Match, Air', 'Heat, Light, Smoke'],
      correct: 0,
      explanation: 'The fire triangle consists of heat, fuel, and oxygen - all three are needed for combustion.'
    },
    {
      question: 'What is the chemical process that creates fire called?',
      options: ['Evaporation', 'Condensation', 'Combustion', 'Sublimation'],
      correct: 2,
      explanation: 'Combustion is the rapid chemical reaction between a fuel and oxygen that produces fire.'
    },
    {
      question: 'What color is the hottest part of a flame?',
      options: ['Red', 'Orange', 'Yellow', 'Blue'],
      correct: 3,
      explanation: 'Blue flames are the hottest, typically around 1,400-1,650°C.'
    },
    {
      question: 'Which ancient human discovery involving fire was crucial for civilization?',
      options: ['Cooking food', 'Making glass', 'Forging metals', 'All of the above'],
      correct: 3,
      explanation: 'Fire enabled cooking (improving nutrition), making glass, forging metals, and many other advances.'
    }
  ],

  // Stage 2: Building Blocks
  'Atom': [
    {
      question: 'What are the three main particles that make up an atom?',
      options: ['Protons, Neutrons, Electrons', 'Protons, Photons, Electrons', 'Neutrons, Positrons, Electrons', 'Quarks, Leptons, Bosons'],
      correct: 0,
      explanation: 'Atoms consist of protons and neutrons in the nucleus, with electrons orbiting around it.'
    },
    {
      question: 'Where is most of an atom\'s mass located?',
      options: ['In the electrons', 'In the nucleus', 'Evenly distributed', 'In the electron cloud'],
      correct: 1,
      explanation: 'The nucleus contains protons and neutrons, which account for nearly all of an atom\'s mass.'
    },
    {
      question: 'What determines an element\'s atomic number?',
      options: ['Number of neutrons', 'Number of electrons', 'Number of protons', 'Total mass'],
      correct: 2,
      explanation: 'The atomic number is defined by the number of protons in an atom\'s nucleus.'
    },
    {
      question: 'What is an atom mostly made of?',
      options: ['Solid matter', 'Empty space', 'Energy', 'Plasma'],
      correct: 1,
      explanation: 'Atoms are mostly empty space between the nucleus and the electron cloud.'
    },
    {
      question: 'Who first proposed the modern atomic theory?',
      options: ['Isaac Newton', 'Albert Einstein', 'John Dalton', 'Marie Curie'],
      correct: 2,
      explanation: 'John Dalton proposed the first modern atomic theory in the early 1800s.'
    }
  ],

  'Molecule': [
    {
      question: 'What is a molecule?',
      options: ['A single atom', 'Two or more atoms bonded together', 'A type of cell', 'A subatomic particle'],
      correct: 1,
      explanation: 'A molecule is formed when two or more atoms chemically bond together.'
    },
    {
      question: 'What type of bond involves sharing electrons between atoms?',
      options: ['Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond'],
      correct: 1,
      explanation: 'Covalent bonds form when atoms share electrons to create molecules.'
    },
    {
      question: 'Which is the smallest molecule?',
      options: ['Water (H2O)', 'Hydrogen (H2)', 'Methane (CH4)', 'Oxygen (O2)'],
      correct: 1,
      explanation: 'Hydrogen (H2) is the smallest molecule, consisting of just two hydrogen atoms.'
    },
    {
      question: 'What is the difference between a compound and a molecule?',
      options: ['They are the same', 'Compounds contain different elements', 'Molecules are always larger', 'Compounds are always gases'],
      correct: 1,
      explanation: 'Compounds are molecules made of different elements, while molecules can be of the same element.'
    }
  ],

  'Element': [
    {
      question: 'How many naturally occurring elements are there?',
      options: ['92', '118', '50', '150'],
      correct: 0,
      explanation: 'There are 92 naturally occurring elements, from hydrogen to uranium.'
    },
    {
      question: 'What makes one element different from another?',
      options: ['Size', 'Color', 'Number of protons', 'Weight'],
      correct: 2,
      explanation: 'Each element has a unique number of protons in its atoms.'
    },
    {
      question: 'What is the most abundant element in the universe?',
      options: ['Oxygen', 'Carbon', 'Hydrogen', 'Iron'],
      correct: 2,
      explanation: 'Hydrogen is the most abundant element in the universe, making up about 75% of all matter.'
    },
    {
      question: 'Where are elements organized?',
      options: ['Element chart', 'Periodic table', 'Atomic list', 'Chemical diagram'],
      correct: 1,
      explanation: 'The periodic table organizes all known elements by their properties and atomic structure.'
    }
  ],

  // ============================================
  // EXPLORER MODE - History Category
  // ============================================
  'Ancient Egypt': [
    {
      question: 'What was the primary writing system used in Ancient Egypt?',
      options: ['Cuneiform', 'Hieroglyphics', 'Latin', 'Sanskrit'],
      correct: 1,
      explanation: 'Ancient Egyptians used hieroglyphics, a system of pictorial symbols.'
    },
    {
      question: 'Which river was essential to Ancient Egyptian civilization?',
      options: ['Tigris', 'Euphrates', 'Nile', 'Amazon'],
      correct: 2,
      explanation: 'The Nile River provided water, food, and transportation for Ancient Egypt.'
    },
    {
      question: 'What were the massive stone structures built as tombs for pharaohs?',
      options: ['Temples', 'Pyramids', 'Ziggurats', 'Castles'],
      correct: 1,
      explanation: 'The pyramids were monumental tombs built for Egyptian pharaohs.'
    },
    {
      question: 'Who was the famous female pharaoh of Ancient Egypt?',
      options: ['Nefertiti', 'Cleopatra', 'Hatshepsut', 'Isis'],
      correct: 2,
      explanation: 'Hatshepsut was one of the most successful female pharaohs, ruling for over 20 years.'
    }
  ],

  'Roman Empire': [
    {
      question: 'Who was the first emperor of Rome?',
      options: ['Julius Caesar', 'Augustus', 'Nero', 'Constantine'],
      correct: 1,
      explanation: 'Augustus (Octavian) became the first Roman Emperor in 27 BCE.'
    },
    {
      question: 'What was the Roman system of government called before the Empire?',
      options: ['Democracy', 'Monarchy', 'Republic', 'Oligarchy'],
      correct: 2,
      explanation: 'Rome was a Republic before becoming an Empire, with elected officials and senators.'
    },
    {
      question: 'What architectural innovation did Romans perfect?',
      options: ['The arch', 'The pyramid', 'The dome', 'Both A and C'],
      correct: 3,
      explanation: 'Romans perfected both the arch and the dome, revolutionary architectural techniques.'
    },
    {
      question: 'In what year did the Western Roman Empire fall?',
      options: ['476 CE', '500 CE', '410 CE', '1453 CE'],
      correct: 0,
      explanation: 'The Western Roman Empire fell in 476 CE when Romulus Augustulus was deposed.'
    }
  ],

  'Middle Ages': [
    {
      question: 'What system of land ownership dominated Medieval Europe?',
      options: ['Capitalism', 'Feudalism', 'Socialism', 'Communism'],
      correct: 1,
      explanation: 'Feudalism was the dominant social and economic system in Medieval Europe.'
    },
    {
      question: 'What were the religious military campaigns to the Holy Land called?',
      options: ['Jihads', 'Crusades', 'Pilgrimages', 'Inquisitions'],
      correct: 1,
      explanation: 'The Crusades were a series of religious wars fought between Christians and Muslims.'
    },
    {
      question: 'What devastating disease killed millions in Europe during the 1300s?',
      options: ['Smallpox', 'The Black Death', 'Influenza', 'Cholera'],
      correct: 1,
      explanation: 'The Black Death (bubonic plague) killed an estimated 75-200 million people.'
    },
    {
      question: 'Who were the armored warriors on horseback in Medieval times?',
      options: ['Samurai', 'Knights', 'Spartans', 'Legionnaires'],
      correct: 1,
      explanation: 'Knights were the mounted warriors of Medieval Europe, bound by chivalric codes.'
    }
  ],

  'Renaissance': [
    {
      question: 'What does "Renaissance" mean?',
      options: ['Rebirth', 'Revolution', 'Reform', 'Renewal'],
      correct: 0,
      explanation: 'Renaissance means "rebirth," referring to the revival of classical learning and art.'
    },
    {
      question: 'Who painted the Mona Lisa?',
      options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
      correct: 1,
      explanation: 'Leonardo da Vinci painted the Mona Lisa around 1503-1519.'
    },
    {
      question: 'In which Italian city did the Renaissance begin?',
      options: ['Rome', 'Venice', 'Florence', 'Milan'],
      correct: 2,
      explanation: 'The Renaissance began in Florence, Italy, in the 14th century.'
    },
    {
      question: 'What invention greatly helped spread Renaissance ideas?',
      options: ['Telegraph', 'Printing press', 'Radio', 'Telescope'],
      correct: 1,
      explanation: 'Gutenberg\'s printing press revolutionized the spread of knowledge during the Renaissance.'
    }
  ],

  'Industrial Revolution': [
    {
      question: 'Where did the Industrial Revolution begin?',
      options: ['France', 'Germany', 'Britain', 'United States'],
      correct: 2,
      explanation: 'The Industrial Revolution began in Britain in the late 18th century.'
    },
    {
      question: 'What was the primary energy source that powered early factories?',
      options: ['Electricity', 'Steam', 'Oil', 'Nuclear'],
      correct: 1,
      explanation: 'Steam power, particularly the steam engine, drove the Industrial Revolution.'
    },
    {
      question: 'What industry was first to be transformed by industrialization?',
      options: ['Agriculture', 'Textile', 'Mining', 'Transportation'],
      correct: 1,
      explanation: 'The textile industry was the first to adopt mechanization and factory systems.'
    },
    {
      question: 'What major social change resulted from industrialization?',
      options: ['Rural migration', 'Urbanization', 'Population decline', 'Agricultural growth'],
      correct: 1,
      explanation: 'Industrialization led to massive urbanization as people moved to cities for factory work.'
    }
  ],

  'World War I': [
    {
      question: 'What event triggered the start of World War I?',
      options: ['Pearl Harbor', 'Assassination of Archduke Franz Ferdinand', 'Invasion of Poland', 'Sinking of the Lusitania'],
      correct: 1,
      explanation: 'The assassination of Archduke Franz Ferdinand in 1914 triggered WWI.'
    },
    {
      question: 'What new weapon caused massive casualties in trench warfare?',
      options: ['Tanks', 'Machine guns', 'Poison gas', 'All of the above'],
      correct: 3,
      explanation: 'WWI saw the introduction of machine guns, poison gas, and tanks, all causing heavy casualties.'
    },
    {
      question: 'When did World War I end?',
      options: ['1914', '1916', '1918', '1920'],
      correct: 2,
      explanation: 'World War I ended on November 11, 1918, with an armistice.'
    },
    {
      question: 'What treaty officially ended WWI?',
      options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Ghent'],
      correct: 1,
      explanation: 'The Treaty of Versailles was signed in 1919, officially ending WWI.'
    }
  ],

  // ============================================
  // EXPLORER MODE - Science Category
  // ============================================
  'Gravity': [
    {
      question: 'Who formulated the law of universal gravitation?',
      options: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Johannes Kepler'],
      correct: 1,
      explanation: 'Isaac Newton formulated the law of universal gravitation in 1687.'
    },
    {
      question: 'What happens to gravity as distance between objects increases?',
      options: ['Gets stronger', 'Gets weaker', 'Stays the same', 'Disappears'],
      correct: 1,
      explanation: 'Gravitational force decreases with the square of the distance between objects.'
    },
    {
      question: 'What is the acceleration due to gravity on Earth?',
      options: ['9.8 m/s²', '10 km/h', '32 ft/min', '100 m/s²'],
      correct: 0,
      explanation: 'Earth\'s gravitational acceleration is approximately 9.8 meters per second squared.'
    },
    {
      question: 'Which has stronger gravity?',
      options: ['Earth', 'Moon', 'Jupiter', 'Mars'],
      correct: 2,
      explanation: 'Jupiter has the strongest gravity of these options due to its massive size.'
    }
  ],

  'Magnetism': [
    {
      question: 'What are the two poles of a magnet called?',
      options: ['Positive and Negative', 'North and South', 'East and West', 'Top and Bottom'],
      correct: 1,
      explanation: 'Magnets have North and South poles that attract and repel each other.'
    },
    {
      question: 'What happens when you bring two north poles together?',
      options: ['They attract', 'They repel', 'They cancel out', 'Nothing happens'],
      correct: 1,
      explanation: 'Like poles (north-north or south-south) repel each other.'
    },
    {
      question: 'Which metal is magnetic?',
      options: ['Copper', 'Aluminum', 'Iron', 'Gold'],
      correct: 2,
      explanation: 'Iron is ferromagnetic and strongly attracted to magnets.'
    },
    {
      question: 'What is Earth itself?',
      options: ['A giant battery', 'A giant magnet', 'A giant capacitor', 'A giant conductor'],
      correct: 1,
      explanation: 'Earth acts as a giant magnet with north and south magnetic poles.'
    }
  ],

  'Light': [
    {
      question: 'What is the speed of light in a vacuum?',
      options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '30,000 km/s'],
      correct: 0,
      explanation: 'Light travels at approximately 300,000 kilometers per second in a vacuum.'
    },
    {
      question: 'Light behaves as both a particle and a...',
      options: ['Gas', 'Liquid', 'Wave', 'Solid'],
      correct: 2,
      explanation: 'Light exhibits wave-particle duality, behaving as both particles (photons) and waves.'
    },
    {
      question: 'What happens when white light passes through a prism?',
      options: ['It disappears', 'It turns black', 'It splits into colors', 'It gets brighter'],
      correct: 2,
      explanation: 'A prism refracts white light, splitting it into its component colors (spectrum).'
    },
    {
      question: 'Which color of visible light has the longest wavelength?',
      options: ['Blue', 'Green', 'Yellow', 'Red'],
      correct: 3,
      explanation: 'Red light has the longest wavelength in the visible spectrum.'
    }
  ],

  'Sound': [
    {
      question: 'How does sound travel?',
      options: ['Through light', 'Through waves', 'Through electricity', 'Through magnetism'],
      correct: 1,
      explanation: 'Sound travels as mechanical waves through a medium like air, water, or solids.'
    },
    {
      question: 'Can sound travel through a vacuum?',
      options: ['Yes', 'No', 'Only loud sounds', 'Only soft sounds'],
      correct: 1,
      explanation: 'Sound cannot travel through a vacuum because it requires a medium to propagate.'
    },
    {
      question: 'What determines the pitch of a sound?',
      options: ['Amplitude', 'Frequency', 'Volume', 'Speed'],
      correct: 1,
      explanation: 'Frequency determines pitch - higher frequencies produce higher pitched sounds.'
    },
    {
      question: 'What is the speed of sound in air at room temperature?',
      options: ['343 m/s', '3,000 m/s', '30 m/s', '3,430 m/s'],
      correct: 0,
      explanation: 'Sound travels at approximately 343 meters per second in air at 20°C.'
    }
  ],

  // ============================================
  // EXPLORER MODE - Biology Category
  // ============================================
  'Cell': [
    {
      question: 'What is the basic unit of life?',
      options: ['Atom', 'Molecule', 'Cell', 'Organ'],
      correct: 2,
      explanation: 'The cell is the basic structural and functional unit of all living organisms.'
    },
    {
      question: 'What are the two main types of cells?',
      options: ['Plant and Animal', 'Prokaryotic and Eukaryotic', 'Large and Small', 'Living and Dead'],
      correct: 1,
      explanation: 'Prokaryotic cells lack a nucleus, while eukaryotic cells have a membrane-bound nucleus.'
    },
    {
      question: 'What organelle is known as the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'],
      correct: 1,
      explanation: 'Mitochondria produce ATP, the energy currency of cells.'
    },
    {
      question: 'Which scientist first discovered cells?',
      options: ['Charles Darwin', 'Louis Pasteur', 'Robert Hooke', 'Gregor Mendel'],
      correct: 2,
      explanation: 'Robert Hooke first observed and named cells in 1665 while examining cork.'
    }
  ],

  'DNA': [
    {
      question: 'What does DNA stand for?',
      options: ['Deoxyribonucleic Acid', 'Dynamic Nuclear Acid', 'Double Nitrogen Acid', 'Dual Nucleotide Arrangement'],
      correct: 0,
      explanation: 'DNA stands for Deoxyribonucleic Acid.'
    },
    {
      question: 'What shape does DNA typically form?',
      options: ['Straight line', 'Circle', 'Double helix', 'Triangle'],
      correct: 2,
      explanation: 'DNA forms a double helix structure, discovered by Watson and Crick.'
    },
    {
      question: 'What are the four bases found in DNA?',
      options: ['A, T, G, C', 'A, U, G, C', 'W, X, Y, Z', 'A, B, C, D'],
      correct: 0,
      explanation: 'DNA contains Adenine (A), Thymine (T), Guanine (G), and Cytosine (C).'
    },
    {
      question: 'Where is DNA primarily located in eukaryotic cells?',
      options: ['Cytoplasm', 'Cell membrane', 'Nucleus', 'Mitochondria only'],
      correct: 2,
      explanation: 'Most DNA in eukaryotic cells is found in the nucleus, though some is in mitochondria.'
    }
  ],

  'Photosynthesis': [
    {
      question: 'What is the main purpose of photosynthesis?',
      options: ['To produce oxygen', 'To convert light into chemical energy', 'To absorb water', 'To release carbon dioxide'],
      correct: 1,
      explanation: 'Photosynthesis converts light energy into chemical energy stored in glucose.'
    },
    {
      question: 'What are the two main products of photosynthesis?',
      options: ['Water and CO2', 'Glucose and Oxygen', 'Nitrogen and Hydrogen', 'Heat and Light'],
      correct: 1,
      explanation: 'Photosynthesis produces glucose (sugar) for energy and releases oxygen as a byproduct.'
    },
    {
      question: 'What pigment is primarily responsible for photosynthesis?',
      options: ['Melanin', 'Hemoglobin', 'Chlorophyll', 'Carotene'],
      correct: 2,
      explanation: 'Chlorophyll is the green pigment that captures light energy for photosynthesis.'
    },
    {
      question: 'Where does photosynthesis occur in plant cells?',
      options: ['Mitochondria', 'Nucleus', 'Chloroplasts', 'Cell wall'],
      correct: 2,
      explanation: 'Photosynthesis occurs in chloroplasts, specialized organelles in plant cells.'
    }
  ],

  'Evolution': [
    {
      question: 'Who is credited with the theory of evolution by natural selection?',
      options: ['Albert Einstein', 'Isaac Newton', 'Charles Darwin', 'Gregor Mendel'],
      correct: 2,
      explanation: 'Charles Darwin proposed the theory of evolution by natural selection.'
    },
    {
      question: 'What is natural selection?',
      options: ['Survival of the fittest', 'Random mutation', 'Artificial breeding', 'Genetic engineering'],
      correct: 0,
      explanation: 'Natural selection is the process where organisms better adapted to their environment tend to survive.'
    },
    {
      question: 'What provides evidence for evolution?',
      options: ['Fossils', 'DNA similarities', 'Comparative anatomy', 'All of the above'],
      correct: 3,
      explanation: 'Multiple lines of evidence support evolution, including fossils, DNA, and anatomical comparisons.'
    },
    {
      question: 'How long does evolution typically take?',
      options: ['Days', 'Years', 'Centuries', 'Millions of years'],
      correct: 3,
      explanation: 'Significant evolutionary changes typically occur over millions of years.'
    }
  ]
};

// Function to get quiz for an article
export function getQuizForArticle(article: string) {
  return QUIZ_QUESTIONS[article] || [];
}

// Function to check if user passed (75% for pass, 100% for golden)
export function evaluateQuizResult(correctAnswers: number, totalQuestions: number) {
  const percentage = (correctAnswers / totalQuestions) * 100;

  if (percentage === 100) {
    return { passed: true, golden: true, percentage };
  } else if (percentage >= 75) {
    return { passed: true, golden: false, percentage };
  } else {
    return { passed: false, golden: false, percentage };
  }
}