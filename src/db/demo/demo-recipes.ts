// Sample Filipino recipes for the demo account created by `npm run db:seed`.
// Photos are in ./images and are stored in the database like a normal upload.
import type { Ingredient } from "@/db/schema";

export type DemoRecipe = {
  name: string;
  description: string;
  category: string; // category name from the default list
  difficulty: "Easy" | "Medium" | "Hard";
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  image: string; // file name in ./images
  favorite?: boolean;
  daysAgo: number; // spreads the sample data over the last weeks for the admin chart
};

const i = (amount: string, unit: string, name: string): Ingredient => ({ amount, unit, name });

export const demoRecipes: DemoRecipe[] = [
  {
    name: "Chicken Adobo",
    description: "Chicken braised in cane vinegar, soy sauce, garlic and bay leaves until tender and glossy. Even better the next day.",
    category: "Dinner",
    difficulty: "Easy",
    cookTimeMinutes: 50,
    servings: 4,
    tags: ["Classic", "Family favorite"],
    ingredients: [
      i("1", "kg", "Chicken thighs and drumsticks"),
      i("1/2", "cup", "Cane vinegar"),
      i("1/3", "cup", "Soy sauce"),
      i("1", "cup", "Water"),
      i("8", "clove", "Garlic, crushed"),
      i("3", "pc", "Dried bay leaves"),
      i("1", "tsp", "Whole black peppercorns"),
      i("1", "tbsp", "Brown sugar"),
    ],
    instructions: [
      "Combine the chicken, soy sauce and garlic in a pot. Marinate for at least 30 minutes.",
      "Add the water, bay leaves and peppercorns. Bring to a boil over medium heat.",
      "Pour in the vinegar and let it boil for 2 minutes without stirring so the sharpness cooks off.",
      "Cover and simmer for 30 minutes, until the chicken is tender.",
      "Stir in the sugar and simmer uncovered until the sauce thickens. Serve with steamed rice.",
    ],
    image: "chicken-adobo.jpg",
    favorite: true,
    daysAgo: 20,
  },
  {
    name: "Chicken Sotanghon Soup",
    description: "Comforting glass-noodle soup with chicken, cabbage and carrots in a garlicky broth tinted with annatto.",
    category: "Lunch",
    difficulty: "Easy",
    cookTimeMinutes: 35,
    servings: 4,
    tags: ["Soup", "Rainy day"],
    ingredients: [
      i("100", "g", "Sotanghon (glass noodles)"),
      i("250", "g", "Chicken breast, shredded"),
      i("6", "cup", "Chicken broth"),
      i("1", "pc", "Carrot, julienned"),
      i("2", "cup", "Cabbage, sliced"),
      i("5", "clove", "Garlic, minced"),
      i("1", "pc", "Onion, chopped"),
      i("2", "tbsp", "Fish sauce"),
      i("1", "tsp", "Annatto powder"),
    ],
    instructions: [
      "Soak the sotanghon in water for 10 minutes, then drain.",
      "Sauté the garlic and onion in oil until fragrant. Add the chicken and cook for 3 minutes.",
      "Pour in the broth, add the annatto powder and bring to a boil.",
      "Add the carrots and cook for 3 minutes, then the cabbage and noodles for another 3 minutes.",
      "Season with fish sauce and pepper. Top with spring onions and fried garlic.",
    ],
    image: "sotanghon.jpg",
    daysAgo: 16,
  },
  {
    name: "Sinugbang Baboy",
    description: "Visayan-style grilled pork belly, marinated overnight in soy, calamansi and garlic, served with a spicy vinegar dip.",
    category: "Dinner",
    difficulty: "Medium",
    cookTimeMinutes: 40,
    servings: 6,
    tags: ["Grilled", "Party"],
    ingredients: [
      i("1", "kg", "Pork belly, sliced 1 cm thick"),
      i("1/2", "cup", "Soy sauce"),
      i("1/4", "cup", "Calamansi juice"),
      i("1", "pc", "Garlic head, minced"),
      i("3", "tbsp", "Brown sugar"),
      i("1/2", "cup", "Banana ketchup"),
      i("1", "tsp", "Ground black pepper"),
    ],
    instructions: [
      "Mix the soy sauce, calamansi, garlic, sugar, ketchup and pepper. Marinate the pork overnight.",
      "Heat the grill until medium-hot. Thread the pork onto skewers if you like.",
      "Grill for 5 to 6 minutes per side, basting with the leftover marinade, until charred at the edges.",
      "Rest for 5 minutes. Serve with vinegar, chili and onions for dipping.",
    ],
    image: "sinugbang-baboy.jpg",
    favorite: true,
    daysAgo: 12,
  },
  {
    name: "Banana Cue",
    description: "Saba bananas fried in caramelized brown sugar and served on bamboo sticks, the classic afternoon merienda.",
    category: "Snacks",
    difficulty: "Easy",
    cookTimeMinutes: 20,
    servings: 4,
    tags: ["Merienda", "Quick", "Budget"],
    ingredients: [
      i("8", "pc", "Ripe saba bananas, peeled"),
      i("1", "cup", "Brown sugar"),
      i("2", "cup", "Cooking oil"),
      i("8", "pc", "Bamboo skewers"),
    ],
    instructions: [
      "Heat the oil in a deep pan over medium heat.",
      "Fry the bananas for 2 to 3 minutes until lightly golden.",
      "Sprinkle the sugar into the oil. Turn the bananas so the melting sugar coats them evenly.",
      "When the coating turns deep amber, lift out the bananas and skewer two per stick. Let the caramel set before eating.",
    ],
    image: "banana-cue.jpg",
    daysAgo: 9,
  },
  {
    name: "Halo-Halo",
    description: "Shaved ice layered with sweet beans, jellies, leche flan and ube, crowned with ice cream. Mix it all before eating.",
    category: "Dessert",
    difficulty: "Easy",
    cookTimeMinutes: 15,
    servings: 2,
    tags: ["Summer", "No cook"],
    ingredients: [
      i("2", "cup", "Shaved ice"),
      i("4", "tbsp", "Sweetened red mung beans"),
      i("4", "tbsp", "Nata de coco"),
      i("4", "tbsp", "Kaong (sugar palm fruit)"),
      i("2", "slice", "Leche flan"),
      i("2", "tbsp", "Ube halaya"),
      i("1/2", "cup", "Evaporated milk"),
      i("2", "pc", "Scoops of ube ice cream"),
    ],
    instructions: [
      "Divide the beans, nata de coco and kaong between two tall glasses.",
      "Fill each glass with shaved ice and pour the evaporated milk over it.",
      "Top with leche flan, ube halaya and a scoop of ice cream. Serve with a long spoon.",
    ],
    image: "halo-halo.jpg",
    daysAgo: 6,
  },
  {
    name: "Pork Sisig",
    description: "Kapampangan sizzling sisig: crispy chopped pork with onions, chili and calamansi, finished with an egg on a hot plate.",
    category: "Dinner",
    difficulty: "Hard",
    cookTimeMinutes: 90,
    servings: 4,
    tags: ["Pulutan", "Spicy"],
    ingredients: [
      i("500", "g", "Pork belly"),
      i("250", "g", "Pork ears"),
      i("1", "pc", "Red onion, finely chopped"),
      i("3", "pc", "Siling labuyo, chopped"),
      i("4", "tbsp", "Calamansi juice"),
      i("2", "tbsp", "Soy sauce"),
      i("2", "tbsp", "Mayonnaise"),
      i("1", "pc", "Egg"),
    ],
    instructions: [
      "Boil the pork belly and ears in salted water for 45 minutes, until tender. Drain and pat dry.",
      "Grill or broil the pork until crispy, then chop into small pieces.",
      "Toss the pork with onion, chili, calamansi, soy sauce and mayonnaise.",
      "Heat a sizzling plate, add the sisig and crack the egg on top. Mix at the table.",
    ],
    image: "sisig.jpg",
    favorite: true,
    daysAgo: 4,
  },
  {
    name: "Tosilog",
    description: "Sweet cured pork tocino with garlic fried rice and a sunny-side-up egg. Breakfast of champions.",
    category: "Breakfast",
    difficulty: "Easy",
    cookTimeMinutes: 25,
    servings: 2,
    tags: ["Silog", "Quick"],
    ingredients: [
      i("300", "g", "Pork tocino"),
      i("3", "cup", "Day-old cooked rice"),
      i("6", "clove", "Garlic, minced"),
      i("2", "pc", "Eggs"),
      i("1/2", "cup", "Water"),
      i("1", "tsp", "Salt"),
    ],
    instructions: [
      "Simmer the tocino in the water until the water evaporates, then fry until caramelized.",
      "In another pan, fry the garlic until golden. Add the rice and salt and stir-fry for 5 minutes.",
      "Fry the eggs sunny side up.",
      "Plate the tocino with the garlic rice and egg. Serve with spiced vinegar and tomatoes.",
    ],
    image: "tosilog.jpg",
    daysAgo: 2,
  },
  {
    name: "Lumpiang Shanghai",
    description: "Crisp, finger-thin spring rolls filled with seasoned ground pork and vegetables. Always the first to go at parties.",
    category: "Snacks",
    difficulty: "Medium",
    cookTimeMinutes: 45,
    servings: 8,
    tags: ["Party", "Make ahead"],
    ingredients: [
      i("500", "g", "Ground pork"),
      i("1", "pc", "Carrot, finely minced"),
      i("1", "pc", "Onion, finely minced"),
      i("4", "clove", "Garlic, minced"),
      i("1", "pc", "Egg"),
      i("1", "tsp", "Salt"),
      i("30", "pc", "Lumpia wrappers"),
      i("3", "cup", "Cooking oil"),
    ],
    instructions: [
      "Mix the pork, carrot, onion, garlic, egg and salt in a bowl.",
      "Spoon a thin line of filling onto each wrapper, roll tightly and seal the edge with water.",
      "Deep-fry in batches at medium heat for 4 to 5 minutes until golden.",
      "Drain on paper towels. Cut in half and serve with sweet chili sauce.",
    ],
    image: "lumpia.jpg",
    daysAgo: 1,
  },
];
