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

  // Stage 3: Life Basics
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
    },
    {
      question: 'What structure controls what enters and leaves a cell?',
      options: ['Cell wall', 'Cytoplasm', 'Cell membrane', 'Nucleus'],
      correct: 2,
      explanation: 'The cell membrane is selectively permeable, controlling substance movement in and out of the cell.'
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
    },
    {
      question: 'What gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
      correct: 2,
      explanation: 'Plants absorb carbon dioxide from the air to use in photosynthesis.'
    }
  ],

  // Add more questions for remaining articles...
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

  'Energy': [
    {
      question: 'What is the law of conservation of energy?',
      options: ['Energy can be created', 'Energy can be destroyed', 'Energy cannot be created or destroyed', 'Energy always increases'],
      correct: 2,
      explanation: 'Energy cannot be created or destroyed, only transformed from one form to another.'
    },
    {
      question: 'What are the two main types of energy?',
      options: ['Hot and Cold', 'Kinetic and Potential', 'Light and Dark', 'Fast and Slow'],
      correct: 1,
      explanation: 'The two main categories are kinetic energy (motion) and potential energy (stored).'
    },
    {
      question: 'What is the SI unit of energy?',
      options: ['Watt', 'Volt', 'Joule', 'Newton'],
      correct: 2,
      explanation: 'The Joule (J) is the standard international unit of energy.'
    },
    {
      question: 'Which is an example of renewable energy?',
      options: ['Coal', 'Natural gas', 'Solar power', 'Nuclear fission'],
      correct: 2,
      explanation: 'Solar power is renewable because sunlight is continuously replenished.'
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