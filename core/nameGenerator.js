const firstNames = [
  "Lukas", "Leon", "Luca", "Finn", "Elias", "Emil", "Luis", "Matteo", "Felix", "Jakob",
  "Hugo", "Arthur", "Jules", "Maël", "Liam", "Noah", "Adam", "Gabriel", "Sacha", "Eden",
  "Oliver", "George", "Harry", "Noah", "Jack", "Leo", "Oscar", "Charlie", "Jacob", "Alfie",
  "Leonardo", "Alessandro", "Francesco", "Mattia", "Andrea", "Gabriele", "Riccardo", "Tommaso", "Edoardo", "Lorenzo",
  "Hugo", "Lucas", "Martin", "Mateo", "Leo", "Daniel", "Alejandro", "Pablo", "Alvaro", "Adrian"
];

const lastNames = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
  "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent",
  "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright",
  "Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno",
  "Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez", "Perez", "Gomez", "Martin"
];

function generateEuropeanName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

module.exports = { generateEuropeanName };
