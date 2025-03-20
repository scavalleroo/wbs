// Collection of diverse people emojis for user representation

export const DIVERSE_PEOPLE_EMOJIS = [
    // Different professions
    '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🏫', '👩‍🏫', 
    '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🚀', '👩‍🚀', '👨‍🎤', '👩‍🎤',
    
    // Different skin tones
    '👨🏻', '👩🏻', '👨🏼', '👩🏼', '👨🏽', '👩🏽', '👨🏾', '👩🏾', '👨🏿', '👩🏿',
    
    // Students and learners
    '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑🏻‍🎓', '🧑🏼‍🎓', '🧑🏽‍🎓', '🧑🏾‍🎓', '🧑🏿‍🎓',
    
    // Other activities
    '🧘‍♀️', '🧘‍♂️', '🏃‍♀️', '🏃‍♂️', '🤔', '🧠', '📚',
    
    // Expressions
    '😊', '🙂', '😌', '🤓', '😎', '🧐',
  ];
  
  // Get a random emoji from the collection
  export const getRandomPersonEmoji = (): string => {
    const randomIndex = Math.floor(Math.random() * DIVERSE_PEOPLE_EMOJIS.length);
    return DIVERSE_PEOPLE_EMOJIS[randomIndex];
  };