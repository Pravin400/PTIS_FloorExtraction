import type { District } from '@/types/assets/map-dashboard.types';
export type { District };

export const divisionColors = {
  konkan: { default: '#64748b', hover: '#475569', selected: '#334155' },
  nashik: { default: '#facc15', hover: '#eab308', selected: '#ca8a04' },
  pune: { default: '#4ade80', hover: '#22c55e', selected: '#16a34a' },
  aurangabad: { default: '#818cf8', hover: '#6366f1', selected: '#4f46e5' },
  amravati: { default: '#f472b6', hover: '#ec4899', selected: '#db2777' },
  nagpur: { default: '#fb923c', hover: '#f97316', selected: '#ea580c' },
};

export const districtsData: Record<string, District> = {
  // Konkan Division - 7 districts
  palghar: {
    id: 'palghar',
    name: 'Palghar',
    headquarters: 'Palghar',
    population: '2.9 Million',
    area: '5,037 km²',
    literacy: '76.93%',
    description: 'Newest district carved out in 2014, featuring coastal areas and tribal regions.',
    keyFacts: [
      'Formed in 2014 from Thane district',
      'Kelva and Shirgaon beaches',
      'Rich tribal culture and traditions',
      'Growing industrial area'
    ],
    division: 'konkan'
  },
  thane: {
    id: 'thane',
    name: 'Thane',
    headquarters: 'Thane',
    population: '11.1 Million',
    area: '4,196 km²',
    literacy: '84.53%',
    description: 'Known as the "City of Lakes", one of the most populous districts in India.',
    keyFacts: [
      'Over 30 lakes within city limits',
      'Major industrial and residential hub',
      'Ancient Kopineshwar Temple',
      'Rapid urban development'
    ],
    division: 'konkan'
  },
  mumbaisuburban: {
    id: 'mumbaisuburban',
    name: 'Mumbai Suburban',
    headquarters: 'Bandra',
    population: '9.3 Million',
    area: '446 km²',
    literacy: '90.08%',
    description: 'The suburban region of Mumbai with highest population density.',
    keyFacts: [
      'Highest literacy rate in Maharashtra',
      'Major residential and commercial areas',
      'Well-connected by local trains',
      'Film City and entertainment industry'
    ],
    division: 'konkan'
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai City',
    headquarters: 'Mumbai',
    population: '3.1 Million',
    area: '157 km²',
    literacy: '89.21%',
    description: 'Financial capital of India and most populous city.',
    keyFacts: [
      'Home to Bollywood film industry',
      'Major port city on west coast',
      'Gateway of India landmark',
      'Financial and commercial hub'
    ],
    division: 'konkan'
  },
  raigad: {
    id: 'raigad',
    name: 'Raigad',
    headquarters: 'Alibag',
    population: '2.6 Million',
    area: '7,152 km²',
    literacy: '83.14%',
    description: 'Historic district with Raigad Fort, capital of Maratha Empire.',
    keyFacts: [
      'Raigad Fort - Chhatrapati Shivaji\'s capital',
      'Alibag beach destination',
      'Rich Maratha heritage',
      'JNPT port - major container terminal'
    ],
    division: 'konkan'
  },
  ratnagiri: {
    id: 'ratnagiri',
    name: 'Ratnagiri',
    headquarters: 'Ratnagiri',
    population: '1.6 Million',
    area: '8,208 km²',
    literacy: '82.18%',
    description: 'Coastal district famous for Alphonso mangoes.',
    keyFacts: [
      'Alphonso mango capital of India',
      'Beautiful Konkan coastline beaches',
      'Birthplace of Lokmanya Tilak',
      'Ratnadurg Fort and temples'
    ],
    division: 'konkan'
  },
  sindhudurg: {
    id: 'sindhudurg',
    name: 'Sindhudurg',
    headquarters: 'Oros',
    population: '849,651',
    area: '5,207 km²',
    literacy: '85.56%',
    description: 'Southernmost district with historic Sindhudurg Fort.',
    keyFacts: [
      'Sindhudurg Fort in Arabian Sea',
      'Pristine beaches and tourism',
      'Famous Malvan coastal cuisine',
      'Cashew and coconut plantations'
    ],
    division: 'konkan'
  },

  // Nashik Division - 5 districts
  nandurbar: {
    id: 'nandurbar',
    name: 'Nandurbar',
    headquarters: 'Nandurbar',
    population: '1.6 Million',
    area: '5,955 km²',
    literacy: '64.38%',
    description: 'Tribal district on Maharashtra-Gujarat border.',
    keyFacts: [
      'Majority tribal population',
      'Toranmal hill station',
      'Rich tribal culture and traditions',
      'Tapi river valley region'
    ],
    division: 'nashik'
  },
  dhule: {
    id: 'dhule',
    name: 'Dhule',
    headquarters: 'Dhule',
    population: '2.1 Million',
    area: '8,063 km²',
    literacy: '79.54%',
    description: 'Important trade center in North Maharashtra.',
    keyFacts: [
      'Power loom textile industry',
      'Ancient Buddhist caves',
      'Major trade center',
      'Tapi river valley agriculture'
    ],
    division: 'nashik'
  },
  jalgaon: {
    id: 'jalgaon',
    name: 'Jalgaon',
    headquarters: 'Jalgaon',
    population: '4.2 Million',
    area: '11,765 km²',
    literacy: '78.20%',
    description: 'Known as "Banana City" for extensive banana cultivation.',
    keyFacts: [
      'Largest banana producer in India',
      'Gateway to Ajanta Caves UNESCO site',
      'Major cotton and gold trade',
      'Important railway junction'
    ],
    division: 'nashik'
  },
  nashik: {
    id: 'nashik',
    name: 'Nashik',
    headquarters: 'Nashik',
    population: '6.1 Million',
    area: '15,582 km²',
    literacy: '82.31%',
    description: 'Holy city hosting Kumbh Mela every 12 years.',
    keyFacts: [
      'Wine capital of India',
      'Trimbakeshwar Jyotirlinga temple',
      'Origin of Godavari river',
      'Major grape and wine production'
    ],
    division: 'nashik'
  },
  ahmednagar: {
    id: 'ahmednagar',
    name: 'Ahmednagar',
    headquarters: 'Ahmednagar',
    population: '4.5 Million',
    area: '17,048 km²',
    literacy: '79.05%',
    description: 'Largest district by area in Maharashtra.',
    keyFacts: [
      'Historic Ahmednagar Fort',
      'Major sugarcane production region',
      'Shani Shingnapur temple',
      'Artillery Center of Indian Army'
    ],
    division: 'nashik'
  },

  // Pune Division - 5 districts
  pune: {
    id: 'pune',
    name: 'Pune',
    headquarters: 'Pune',
    population: '9.4 Million',
    area: '15,642 km²',
    literacy: '86.15%',
    description: 'Cultural capital and major educational hub.',
    keyFacts: [
      'Oxford of the East',
      'Major IT and automobile industry',
      'Rich Maratha heritage sites',
      'Aga Khan Palace and Shaniwar Wada'
    ],
    division: 'pune'
  },
  satara: {
    id: 'satara',
    name: 'Satara',
    headquarters: 'Satara',
    population: '3.0 Million',
    area: '10,480 km²',
    literacy: '82.87%',
    description: 'Hill station district known for strawberries.',
    keyFacts: [
      'Strawberry capital of Maharashtra',
      'Mahabaleshwar and Panchgani hills',
      'Origin of Krishna river',
      'Kaas Plateau UNESCO World Heritage site'
    ],
    division: 'pune'
  },
  sangli: {
    id: 'sangli',
    name: 'Sangli',
    headquarters: 'Sangli',
    population: '2.8 Million',
    area: '8,572 km²',
    literacy: '81.48%',
    description: 'Major producer of turmeric and grapes.',
    keyFacts: [
      'Turmeric capital of Maharashtra',
      'Grape and sugarcane cultivation',
      'Krishna river valley',
      'Textile and sugar industry hub'
    ],
    division: 'pune'
  },
  kolhapur: {
    id: 'kolhapur',
    name: 'Kolhapur',
    headquarters: 'Kolhapur',
    population: '3.9 Million',
    area: '7,685 km²',
    literacy: '81.51%',
    description: 'Known for culture, wrestling, and Mahalaxmi temple.',
    keyFacts: [
      'Famous Mahalaxmi Temple',
      'Kolhapuri chappals and cuisine',
      'Strong wrestling tradition',
      'Princely state heritage'
    ],
    division: 'pune'
  },
  solapur: {
    id: 'solapur',
    name: 'Solapur',
    headquarters: 'Solapur',
    population: '4.3 Million',
    area: '14,895 km²',
    literacy: '77.27%',
    description: 'Textile industry hub with religious significance.',
    keyFacts: [
      'Famous Solapuri chadars and towels',
      'Siddheshwar Temple',
      'Akkalkot Swami Samarth shrine',
      'Major textile manufacturing center'
    ],
    division: 'pune'
  },

  // Aurangabad Division - 8 districts
  aurangabad: {
    id: 'aurangabad',
    name: 'Aurangabad',
    headquarters: 'Aurangabad',
    population: '3.7 Million',
    area: '10,107 km²',
    literacy: '79.02%',
    description: 'Tourism capital with UNESCO World Heritage sites.',
    keyFacts: [
      'Bibi Ka Maqbara - Mini Taj Mahal',
      'Gateway to Ajanta-Ellora Caves',
      'UNESCO World Heritage sites',
      'Growing industrial and IT hub'
    ],
    division: 'aurangabad'
  },
  jalna: {
    id: 'jalna',
    name: 'Jalna',
    headquarters: 'Jalna',
    population: '1.9 Million',
    area: '7,718 km²',
    literacy: '71.52%',
    description: 'Industrial town with cotton and textile industry.',
    keyFacts: [
      'Cotton ginning and pressing center',
      'Matsyodari Devi Temple',
      'Ancient Jain temples',
      'Growing industrial base'
    ],
    division: 'aurangabad'
  },
  beed: {
    id: 'beed',
    name: 'Beed',
    headquarters: 'Beed',
    population: '2.6 Million',
    area: '10,693 km²',
    literacy: '76.99%',
    description: 'Agricultural district in Marathwada region.',
    keyFacts: [
      'Sugarcane and cotton farming',
      'Kankaleshwar Temple',
      'Parli Vaijnath Jyotirlinga',
      'Ancient heritage sites'
    ],
    division: 'aurangabad'
  },
  parbhani: {
    id: 'parbhani',
    name: 'Parbhani',
    headquarters: 'Parbhani',
    population: '1.8 Million',
    area: '6,511 km²',
    literacy: '71.17%',
    description: 'District in Marathwada with diverse culture.',
    keyFacts: [
      'Near Tuljabhavani Temple',
      'Cotton and soybean cultivation',
      'Jayakwadi Bird Sanctuary',
      'Sufism cultural influence'
    ],
    division: 'aurangabad'
  },
  hingoli: {
    id: 'hingoli',
    name: 'Hingoli',
    headquarters: 'Hingoli',
    population: '1.2 Million',
    area: '4,827 km²',
    literacy: '78.17%',
    description: 'Smallest district formed in 1999.',
    keyFacts: [
      'Aundha Nagnath Jyotirlinga temple',
      'Cotton cultivation region',
      'Historical forts',
      'Penganga river flows through'
    ],
    division: 'aurangabad'
  },
  nanded: {
    id: 'nanded',
    name: 'Nanded',
    headquarters: 'Nanded',
    population: '3.4 Million',
    area: '10,502 km²',
    literacy: '75.45%',
    description: 'Important Sikh pilgrimage center.',
    keyFacts: [
      'Hazur Sahib - one of five Takhts',
      'Guru Gobind Singh sacred site',
      'Major Sikh pilgrimage destination',
      'Located on banks of Godavari'
    ],
    division: 'aurangabad'
  },
  latur: {
    id: 'latur',
    name: 'Latur',
    headquarters: 'Latur',
    population: '2.5 Million',
    area: '7,157 km²',
    literacy: '77.26%',
    description: 'Educational hub and sugarcane region.',
    keyFacts: [
      'Major sugarcane cultivation',
      'Ganjgolai historical monument',
      'Educational institutions hub',
      'Ausa Fort nearby'
    ],
    division: 'aurangabad'
  },
  osmanabad: {
    id: 'osmanabad',
    name: 'Osmanabad',
    headquarters: 'Osmanabad',
    population: '1.7 Million',
    area: '7,569 km²',
    literacy: '78.44%',
    description: 'Named after the last Nizam of Hyderabad.',
    keyFacts: [
      'Tuljabhavani Temple',
      'Ancient Naldurg Fort',
      'Cotton and jowar cultivation',
      'Rich historical monuments'
    ],
    division: 'aurangabad'
  },

  // Amravati Division - 5 districts
  amravati: {
    id: 'amravati',
    name: 'Amravati',
    headquarters: 'Amravati',
    population: '2.9 Million',
    area: '12,235 km²',
    literacy: '87.38%',
    description: 'Cotton hub and cultural center of Vidarbha.',
    keyFacts: [
      'Major cotton trade center',
      'Ambadevi Temple',
      'Chikhaldara hill station',
      'Melghat Tiger Reserve nearby'
    ],
    division: 'amravati'
  },
  akola: {
    id: 'akola',
    name: 'Akola',
    headquarters: 'Akola',
    population: '1.8 Million',
    area: '5,431 km²',
    literacy: '88.05%',
    description: 'Cotton city and railway junction.',
    keyFacts: [
      'Major cotton trade center',
      'Raj Rajeshwar Temple',
      'Important railway junction',
      'Educational hub of Vidarbha'
    ],
    division: 'amravati'
  },
  buldhana: {
    id: 'buldhana',
    name: 'Buldhana',
    headquarters: 'Buldhana',
    population: '2.6 Million',
    area: '9,661 km²',
    literacy: '83.40%',
    description: 'Agricultural heartland with cotton cultivation.',
    keyFacts: [
      'Cotton and soybean production',
      'Lonar Crater Lake - meteorite impact',
      'Anwa Power Station',
      'Shegaon religious center'
    ],
    division: 'amravati'
  },
  washim: {
    id: 'washim',
    name: 'Washim',
    headquarters: 'Washim',
    population: '1.2 Million',
    area: '5,150 km²',
    literacy: '83.25%',
    description: 'Small agricultural district in Vidarbha.',
    keyFacts: [
      'Cotton and soybean farming',
      'Balaji Temple',
      'Ancient Jain temples',
      'Karanja Gad Fort'
    ],
    division: 'amravati'
  },
  yavatmal: {
    id: 'yavatmal',
    name: 'Yavatmal',
    headquarters: 'Yavatmal',
    population: '2.8 Million',
    area: '13,582 km²',
    literacy: '82.82%',
    description: 'Major cotton producing district.',
    keyFacts: [
      'Largest cotton growing district',
      'Tipeshwar Wildlife Sanctuary',
      'Rich biodiversity',
      'Wardha river flows through'
    ],
    division: 'amravati'
  },

  // Nagpur Division - 6 districts
  nagpur: {
    id: 'nagpur',
    name: 'Nagpur',
    headquarters: 'Nagpur',
    population: '4.6 Million',
    area: '9,892 km²',
    literacy: '88.39%',
    description: 'Orange City and winter capital of Maharashtra.',
    keyFacts: [
      'Orange capital of India',
      'Zero Mile marker - center of India',
      'Major transport and logistics hub',
      'Tiger capital with nearby reserves'
    ],
    division: 'nagpur'
  },
  wardha: {
    id: 'wardha',
    name: 'Wardha',
    headquarters: 'Wardha',
    population: '1.3 Million',
    area: '6,309 km²',
    literacy: '86.99%',
    description: 'Gandhi\'s Sevagram Ashram location.',
    keyFacts: [
      'Sevagram Ashram - Gandhi\'s home',
      'Cotton production center',
      'Wardha river valley',
      'Educational institutions'
    ],
    division: 'nagpur'
  },
  chandrapur: {
    id: 'chandrapur',
    name: 'Chandrapur',
    headquarters: 'Chandrapur',
    population: '2.2 Million',
    area: '11,443 km²',
    literacy: '80.01%',
    description: 'Coal and power hub with tiger reserve.',
    keyFacts: [
      'Black Gold City - coal reserves',
      'Tadoba Andhari Tiger Reserve',
      'Major thermal power plants',
      'Ancient Mahakali Temple'
    ],
    division: 'nagpur'
  },
  gadchiroli: {
    id: 'gadchiroli',
    name: 'Gadchiroli',
    headquarters: 'Gadchiroli',
    population: '1.1 Million',
    area: '14,412 km²',
    literacy: '74.36%',
    description: 'Eastern district with dense forests.',
    keyFacts: [
      'Largest forest cover in Maharashtra',
      'Rich tribal heritage',
      'Iron ore deposits',
      'Remote and scenic landscapes'
    ],
    division: 'nagpur'
  },
  gondia: {
    id: 'gondia',
    name: 'Gondia',
    headquarters: 'Gondia',
    population: '1.3 Million',
    area: '5,234 km²',
    literacy: '84.95%',
    description: 'Rice bowl of Vidarbha with rich forests.',
    keyFacts: [
      'Major rice production region',
      'Dense forests and wildlife',
      'Navegaon National Park',
      'Coal and limestone deposits'
    ],
    division: 'nagpur'
  },
  bhandara: {
    id: 'bhandara',
    name: 'Bhandara',
    headquarters: 'Bhandara',
    population: '1.2 Million',
    area: '3,890 km²',
    literacy: '83.76%',
    description: 'Known for rice and bell metal craft.',
    keyFacts: [
      'Rice production center',
      'Tumsar bell metal craft',
      'Wainganga river valley',
      'Dense teak forests'
    ],
    division: 'nagpur'
  }
};
