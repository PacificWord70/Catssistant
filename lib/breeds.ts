export function breedSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export type Continent = 'North America' | 'Europe' | 'Asia' | 'Africa' | 'Various'

export interface Breed {
  name: string
  origin: string
  continent: Continent
  description: string
  traits: {
    energy: 'Low' | 'Medium' | 'High'
    friendliness: 'Reserved' | 'Moderate' | 'Friendly' | 'Very Friendly'
    grooming: 'Low' | 'Medium' | 'High'
    vocality: 'Quiet' | 'Moderate' | 'Vocal'
  }
}

export const BREEDS: Breed[] = [
  {
    name: 'Abyssinian',
    origin: 'Ethiopia',
    continent: 'Africa',
    description:
      'One of the oldest known cat breeds, the Abyssinian is slender, athletic, and endlessly curious. They are highly active and thrive on exploration and interaction — rarely content to sit still for long. Their short, ticked coat gives them a wild, warm appearance, and their personality is equally vivid.',
    traits: { energy: 'High', friendliness: 'Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'American Shorthair',
    origin: 'United States',
    continent: 'North America',
    description:
      'A hardy, adaptable breed with a easygoing personality that makes them a natural fit for almost any household. They are playful without being demanding, affectionate without being clingy, and known for their long, healthy lives.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'Low', vocality: 'Quiet' },
  },
  {
    name: 'Balinese',
    origin: 'United States',
    continent: 'North America',
    description:
      'The Balinese is essentially a long-haired Siamese — sharing the same colorpoint coat, blue eyes, and outspoken personality, but with a silky, flowing coat and a slightly softer temperament. They are affectionate, chatty, and highly people-oriented, following their owners from room to room and making their opinions known.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Medium', vocality: 'Vocal' },
  },
  {
    name: 'Bengal',
    origin: 'United States',
    continent: 'North America',
    description:
      'Bengals are athletic, curious, and highly intelligent cats with a striking wild appearance — their coats feature bold rosettes or marbling inherited from their Asian leopard cat ancestry. They love to climb, explore, and stay busy, and do best with plenty of stimulation.',
    traits: { energy: 'High', friendliness: 'Moderate', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Bombay',
    origin: 'United States',
    continent: 'North America',
    description:
      'The Bombay was developed to resemble a miniature black panther, and it delivers — sleek, jet-black coat, copper eyes, and a muscular, compact build. Despite the dramatic looks, they are warm, affectionate, and thoroughly people-focused. They tend to bond closely with their household and do not like being left alone for long.',
    traits: { energy: 'Medium', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'Burmese',
    origin: 'Myanmar',
    continent: 'Asia',
    description:
      'Burmese are compact, muscular cats with a surprising weight for their size — often called "bricks wrapped in silk." They are deeply social and affectionate, craving attention and closeness with their people. Playful well into adulthood and highly interactive, they do not thrive as solo cats.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Birman',
    origin: 'Myanmar',
    continent: 'Asia',
    description:
      'Birmans are gentle, quiet, and deeply devoted to their people. They have a distinctive colorpoint coat with silky fur and bright blue eyes, and their most recognizable feature is their white "gloves" on each paw. They are calm companions who enjoy being near you without being overbearing.',
    traits: { energy: 'Low', friendliness: 'Very Friendly', grooming: 'Medium', vocality: 'Quiet' },
  },
  {
    name: 'Chartreux',
    origin: 'France',
    continent: 'Europe',
    description:
      'The Chartreux is a quiet, observant French breed with a distinctive blue-grey coat and copper or gold eyes. They are gentle and loyal — often bonding closely with one person — and are known for their calm intelligence and adaptability. They rarely vocalize but communicate clearly through expression and body language.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'Low', vocality: 'Quiet' },
  },
  {
    name: 'Cornish Rex',
    origin: 'United Kingdom',
    continent: 'Europe',
    description:
      'The Cornish Rex has a soft, wavy coat unlike any other breed — the result of a natural mutation — and a lean, aerodynamic build that matches their personality. They are energetic, playful, and mischievous well into old age, and they love warmth, often seeking out sunny spots or snuggling under blankets.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'Devon Rex',
    origin: 'United Kingdom',
    continent: 'Europe',
    description:
      'The Devon Rex is a pixie-like cat with large ears, wide eyes, and a short wavy coat that feels almost like suede. They are impish, affectionate, and constantly seeking warmth and attention — often perching on shoulders or burrowing under covers. Their playful energy and clownish personality make them hard to ignore.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'British Shorthair',
    origin: 'United Kingdom',
    continent: 'Europe',
    description:
      'The British Shorthair is a sturdy, dignified cat with a plush dense coat and a calm, steady temperament. They are affectionate in a low-key way — happy to be in the same room as you without necessarily needing to be in your lap. They tend to be patient and do well in quieter homes.',
    traits: { energy: 'Low', friendliness: 'Moderate', grooming: 'Low', vocality: 'Quiet' },
  },
  {
    name: 'Domestic Shorthair',
    origin: 'Various',
    continent: 'Various',
    description:
      'The domestic shorthair is not a breed but a category — the mixed-breed cats that make up the majority of the cat population. Their personalities, appearances, and traits vary widely, which makes every domestic shorthair uniquely their own. They tend to be hardy and adaptable.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'Domestic Longhair',
    origin: 'Various',
    continent: 'Various',
    description:
      'Like their shorthaired counterparts, domestic longhairs are mixed-breed cats with long or semi-long coats. Their personalities span the full range — playful or laid-back, chatty or quiet — but their coats require regular brushing to prevent tangles and mats.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'High', vocality: 'Moderate' },
  },
  {
    name: 'Egyptian Mau',
    origin: 'Egypt',
    continent: 'Africa',
    description:
      'The Egyptian Mau is one of the few naturally spotted domestic cat breeds, with a striking pattern and a history that traces back to ancient Egypt. They are fast, athletic, and fiercely loyal to their family — affectionate with those they trust but reserved around strangers. They are also known for a distinctive musical chirp.',
    traits: { energy: 'High', friendliness: 'Moderate', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Himalayan',
    origin: 'United States',
    continent: 'North America',
    description:
      'The Himalayan is a cross between the Persian and Siamese — combining the Persian\'s long, luxurious coat and calm temperament with the Siamese\'s colorpoint markings and blue eyes. They are gentle, quiet, and affectionate, happiest in peaceful environments where they can lounge in comfort.',
    traits: { energy: 'Low', friendliness: 'Friendly', grooming: 'High', vocality: 'Quiet' },
  },
  {
    name: 'Maine Coon',
    origin: 'United States',
    continent: 'North America',
    description:
      'One of the largest domestic cat breeds, the Maine Coon has a thick, shaggy coat built for cold climates and a playful, dog-like personality. They are sociable, curious, and gentle — often following their owners around the house and enjoying interactive play well into adulthood.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'High', vocality: 'Moderate' },
  },
  {
    name: 'Persian',
    origin: 'Iran (Persia)',
    continent: 'Asia',
    description:
      'Persians are calm, sweet-natured cats with a luxurious long coat and a distinctive flat face. They prefer quiet, predictable environments and are most content lounging in comfort. Their coat requires daily brushing, and their facial structure means their eyes need regular cleaning.',
    traits: { energy: 'Low', friendliness: 'Moderate', grooming: 'High', vocality: 'Quiet' },
  },
  {
    name: 'Ragdoll',
    origin: 'United States',
    continent: 'North America',
    description:
      'Ragdolls earn their name by going limp when picked up — they are extraordinarily relaxed, gentle cats who tend to follow their people from room to room. They have striking blue eyes, a semi-long colorpoint coat, and a temperament so easygoing they are often recommended for families.',
    traits: { energy: 'Low', friendliness: 'Very Friendly', grooming: 'Medium', vocality: 'Quiet' },
  },
  {
    name: 'Manx',
    origin: 'Isle of Man',
    continent: 'Europe',
    description:
      'The Manx is best known for its naturally short or absent tail — the result of a genetic mutation originating on the Isle of Man. Beyond that, they are sturdy, rounded cats with a playful, dog-like temperament. They are loyal and social, often following their owners around and enjoying interactive games.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'Low', vocality: 'Quiet' },
  },
  {
    name: 'Oriental Shorthair',
    origin: 'Thailand',
    continent: 'Asia',
    description:
      'The Oriental Shorthair shares its sleek build and lively personality with the Siamese but comes in a remarkable range of coat colors and patterns. They are talkative, inquisitive, and intensely social — they want to be involved in everything and do not do well with being ignored.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Russian Blue',
    origin: 'Russia',
    continent: 'Europe',
    description:
      'The Russian Blue is an elegant, reserved cat with a dense blue-grey coat that shimmers silver at the tips. They are loyal and deeply bonded to their people but tend to be shy around strangers. At home, they are playful, gentle, and known for being particularly sensitive to their owner\'s mood.',
    traits: { energy: 'Medium', friendliness: 'Reserved', grooming: 'Low', vocality: 'Quiet' },
  },
  {
    name: 'Scottish Fold',
    origin: 'Scotland',
    continent: 'Europe',
    description:
      'Scottish Folds are known for their distinctive folded ears, which give them an owl-like appearance. They are sweet, adaptable, and tend to bond closely with one or two people. They enjoy company and play but are not overly demanding — they are just as happy sitting quietly beside you.',
    traits: { energy: 'Medium', friendliness: 'Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'Siamese',
    origin: 'Thailand',
    continent: 'Asia',
    description:
      'Siamese are one of the oldest and most recognizable breeds — vocal, social, and intensely people-oriented. They communicate constantly and do not like being left alone for long periods. Their sleek colorpoint coat, almond-shaped blue eyes, and strong personality make them hard to forget.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Siberian',
    origin: 'Russia',
    continent: 'Europe',
    description:
      'Siberians are large, powerful cats with a thick triple-layered coat developed for surviving harsh Russian winters. Despite their size, they are agile and playful, and their affectionate, dog-like nature makes them excellent companions. They are also considered one of the lower-allergen breeds.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Medium', vocality: 'Moderate' },
  },
  {
    name: 'Savannah',
    origin: 'United States',
    continent: 'North America',
    description:
      'The Savannah is a hybrid breed crossed with the African serval, resulting in a tall, long-legged cat with bold spotted markings and an assertive personality. They are highly active, intelligent, and loyal — often compared to dogs in their trainability and attachment. They need significant space, stimulation, and an owner ready for an adventure.',
    traits: { energy: 'High', friendliness: 'Moderate', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Singapura',
    origin: 'Singapore',
    continent: 'Asia',
    description:
      'The Singapura is one of the smallest domestic cat breeds, but their personality is anything but small. They are curious, playful, and people-oriented — always wanting to be in the middle of things. Their large eyes and ticked beige coat give them an alert, almost perpetually surprised expression.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Moderate' },
  },
  {
    name: 'Sphynx',
    origin: 'Canada',
    continent: 'North America',
    description:
      'The Sphynx is a hairless cat with surprisingly warm, suede-like skin and an enormous personality. They are extroverted, attention-seeking, and endlessly entertaining — always in the middle of whatever is happening. Without a coat for insulation, they run warm and tend to seek out body heat.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Medium', vocality: 'Vocal' },
  },
  {
    name: 'Tonkinese',
    origin: 'Canada',
    continent: 'North America',
    description:
      'The Tonkinese is a cross between the Burmese and Siamese, blending the best of both — the Siamese\'s outgoing nature with the Burmese\'s warmth and sturdiness. They are playful, talkative, and deeply affectionate, forming strong bonds with their people and thriving on companionship.',
    traits: { energy: 'High', friendliness: 'Very Friendly', grooming: 'Low', vocality: 'Vocal' },
  },
  {
    name: 'Turkish Angora',
    origin: 'Turkey',
    continent: 'Asia',
    description:
      'Turkish Angoras are elegant, silky-coated cats with a playful and sometimes mischievous streak. They are intelligent and social, often bonding strongly with one person while remaining friendly with the household. They love to be involved and are known for their graceful, almost dancer-like movement.',
    traits: { energy: 'High', friendliness: 'Friendly', grooming: 'Medium', vocality: 'Moderate' },
  },
]
