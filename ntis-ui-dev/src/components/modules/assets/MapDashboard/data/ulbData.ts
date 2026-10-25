// Comprehensive ULB data for all 36 districts of Maharashtra
// State-level totals: 29 Municipal Corporations, 232 Municipal Councils, 125 Nagar Panchayats

import type { DistrictULBs } from '@/types/assets/map-dashboard.types';
export type { DistrictULBs };

export const districtULBData: Record<string, DistrictULBs> = {
  // 1. Ahmednagar District
  'Ahmednagar': {
    'Municipal Corporations': ['Ahmednagar'],
    'Municipal Councils': ['Shrirampur', 'Sangamner', 'Kopargaon', 'Rahuri', 'Nevasa', 'Parner', 'Shrigonda', 'Newasa', 'Kedgaon', 'Supa'],
    'Nagar Panchayats': ['Karjat', 'Jamkhed', 'Pathardi', 'Shevgaon', 'Akole', 'Vambori']
  },

  // 2. Akola District
  'Akola': {
    'Municipal Corporations': ['Akola'],
    'Municipal Councils': ['Akot', 'Balapur', 'Murtizapur', 'Patur', 'Telhara'],
    'Nagar Panchayats': ['Barshitakli']
  },

  // 3. Amravati District
  'Amravati': {
    'Municipal Corporations': ['Amravati'],
    'Municipal Councils': ['Achalpur', 'Anjangaon Surji', 'Chandur Railway', 'Chandurbazar', 'Chikhaldara', 'Daryapur', 'Dhamangaon Railway', 'Morshi', 'Shendurjana Ghat'],
    'Nagar Panchayats': ['Tivsa', 'Dharni', 'Nandgaon Khandeshwar', 'Bhatkuli']
  },

  // 4. Aurangabad District
  'Aurangabad': {
    'Municipal Corporations': ['Aurangabad'],
    'Municipal Councils': ['Paithan', 'Gangapur', 'Vaijapur', 'Khuldabad', 'Kannad', 'Aurangabad Cantonment'],
    'Nagar Panchayats': ['Phulambri', 'Soegaon', 'Sillegaon', 'Waluj', 'Bidkin']
  },

  // 5. Beed District
  'Beed': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Beed', 'Parli Vaijnath', 'Gevrai', 'Shirur Kasar', 'Majalgaon', 'Ambajogai', 'Wadwani'],
    'Nagar Panchayats': ['Dharur', 'Patoda', 'Ashti', 'Kaij', 'Georai']
  },

  // 6. Bhandara District
  'Bhandara': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Bhandara', 'Tumsar', 'Mohadi', 'Pauni', 'Lakhandur'],
    'Nagar Panchayats': ['Lakhani', 'Sakoli', 'Dongargaon']
  },

  // 7. Buldhana District
  'Buldhana': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Buldhana', 'Khamgaon', 'Malkapur', 'Chikhli', 'Jalgaon Jamod', 'Mehkar', 'Nandura', 'Shegaon', 'Motala', 'Sangrampur'],
    'Nagar Panchayats': ['Deulgaon Raja', 'Lonar', 'Sindkhed Raja', 'Sultanpur']
  },

  // 8. Chandrapur District
  'Chandrapur': {
    'Municipal Corporations': ['Chandrapur'],
    'Municipal Councils': ['Ballarpur', 'Rajura', 'Warora', 'Bramhapuri', 'Chimur', 'Mul', 'Chandrapur Cantonment'],
    'Nagar Panchayats': ['Nagbhir', 'Pombhurna', 'Sindewahi', 'Korpana', 'Bhadravati']
  },

  // 9. Dhule District
  'Dhule': {
    'Municipal Corporations': ['Dhule'],
    'Municipal Councils': ['Sakri', 'Shirpur', 'Sindkheda', 'Dhule Cantonment'],
    'Nagar Panchayats': ['Nandurbar Old', 'Shahada Old', 'Taloda Old']
  },

  // 10. Gadchiroli District
  'Gadchiroli': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Gadchiroli', 'Desaiganj', 'Armori', 'Kurkheda'],
    'Nagar Panchayats': ['Aheri', 'Chamorshi', 'Mulchera', 'Sironcha']
  },

  // 11. Gondia District
  'Gondia': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Gondia', 'Tirora', 'Goregaon', 'Amgaon'],
    'Nagar Panchayats': ['Arjuni Morgaon', 'Salekasa', 'Sadak Arjuni', 'Deori']
  },

  // 12. Hingoli District
  'Hingoli': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Hingoli', 'Kalamnuri', 'Basmat', 'Aundha Nagnath'],
    'Nagar Panchayats': ['Sengaon', 'Vasmat']
  },

  // 13. Jalgaon District
  'Jalgaon': {
    'Municipal Corporations': ['Jalgaon'],
    'Municipal Councils': ['Bhusawal', 'Amalner', 'Chalisgaon', 'Chopda', 'Pachora', 'Jamner', 'Raver', 'Jalgaon Cantonment'],
    'Nagar Panchayats': ['Dharangaon', 'Erandol', 'Parola', 'Bodwad', 'Yawal', 'Bhadgaon']
  },

  // 14. Jalna District
  'Jalna': {
    'Municipal Corporations': ['Jalna'],
    'Municipal Councils': ['Bhokardan', 'Ghansawangi', 'Jafrabad', 'Partur', 'Jalna Cantonment'],
    'Nagar Panchayats': ['Mantha', 'Ambad', 'Badnapur', 'Bhokardan']
  },

  // 15. Kolhapur District
  'Kolhapur': {
    'Municipal Corporations': ['Kolhapur', 'Ichalkaranji'],
    'Municipal Councils': ['Panhala', 'Kagal', 'Jaysingpur', 'Shirol', 'Gadhinglaj', 'Hatkanangle', 'Kolhapur Cantonment'],
    'Nagar Panchayats': ['Radhanagari', 'Kurundwad', 'Gargoti', 'Nesari', 'Uchgaon']
  },

  // 16. Latur District
  'Latur': {
    'Municipal Corporations': ['Latur'],
    'Municipal Councils': ['Nilanga', 'Udgir', 'Ausa', 'Chakur', 'Shirur Anantpal'],
    'Nagar Panchayats': ['Ahmadpur', 'Renapur', 'Jalkot', 'Deoni', 'Killari']
  },

  // 17. Mumbai City District
  'Mumbai': {
    'Municipal Corporations': ['Mumbai'],
    'Municipal Councils': [],
    'Nagar Panchayats': []
  },

  // 18. Mumbai Suburban District
  'Mumbai Suburban': {
    'Municipal Corporations': [],
    'Municipal Councils': [],
    'Nagar Panchayats': []
  },

  // 19. Nagpur District
  'Nagpur': {
    'Municipal Corporations': ['Nagpur'],
    'Municipal Councils': ['Kamptee', 'Ramtek', 'Saoner', 'Katol', 'Umred', 'Kuhi', 'Kalmeshwar', 'Nagpur Cantonment'],
    'Nagar Panchayats': ['Parseoni', 'Narkhed', 'Mauda', 'Nagardhan', 'Bhiwapur', 'Kalamna']
  },

  // 20. Nanded District
  'Nanded': {
    'Municipal Corporations': ['Nanded–Waghala'],
    'Municipal Councils': ['Kinwat', 'Mukhed', 'Deglur', 'Hadgaon', 'Himayatnagar', 'Ardhapur', 'Nanded Cantonment'],
    'Nagar Panchayats': ['Loha', 'Bhokar', 'Umri', 'Kandhar', 'Mahur', 'Naigaon']
  },

  // 21. Nashik District
  'Nashik': {
    'Municipal Corporations': ['Nashik', 'Malegaon'],
    'Municipal Councils': ['Igatpuri', 'Sinnar', 'Niphad', 'Dindori', 'Yeola', 'Manmad', 'Satana', 'Kalwan', 'Nashik Road', 'Deolali'],
    'Nagar Panchayats': ['Ojhar', 'Vinchur', 'Pimpalgaon Baswant', 'Deolali Camp', 'Lasalgaon', 'Nampur']
  },

  // 22. Osmanabad District
  'Osmanabad': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Osmanabad', 'Tuljapur', 'Paranda', 'Bhum', 'Omerga', 'Osmanabad Cantonment'],
    'Nagar Panchayats': ['Kalamb', 'Washi', 'Lohara', 'Ter']
  },

  // 23. Palghar District
  'Palghar': {
    'Municipal Corporations': ['Vasai–Virar'],
    'Municipal Councils': ['Palghar', 'Dahanu', 'Talasari', 'Wada', 'Jawhar', 'Mokhada', 'Vikramgad'],
    'Nagar Panchayats': ['Manor', 'Vasind', 'Kasa', 'Satpati', 'Kelva']
  },

  // 24. Parbhani District
  'Parbhani': {
    'Municipal Corporations': ['Parbhani'],
    'Municipal Councils': ['Purna', 'Jintur', 'Pathri', 'Gangakhed', 'Palam'],
    'Nagar Panchayats': ['Sonpeth', 'Selu', 'Manwath', 'Sailu', 'Parbhani Cantonment']
  },

  // 25. Pune District
  'Pune': {
    'Municipal Corporations': ['Pune', 'Pimpri–Chinchwad'],
    'Municipal Councils': ['Khadki', 'Dehu Road', 'Chinchwad', 'Talegaon Dabhade', 'Lonavala', 'Khandala', 'Daund', 'Indapur', 'Baramati', 'Alandi', 'Junnar', 'Bhosari'],
    'Nagar Panchayats': ['Saswad', 'Jejuri', 'Shirur', 'Rajgurunagar', 'Chakan', 'Manchar', 'Khed']
  },

  // 26. Raigad District
  'Raigad': {
    'Municipal Corporations': ['Panvel'],
    'Municipal Councils': ['Alibag', 'Pen', 'Uran', 'Karjat', 'Khopoli', 'Mahad', 'Roha', 'Mangaon', 'Matheran'],
    'Nagar Panchayats': ['Murud', 'Shrivardhan', 'Sudhagad', 'Tala', 'Poladpur', 'Nagothana']
  },

  // 27. Ratnagiri District
  'Ratnagiri': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Ratnagiri', 'Chiplun', 'Dapoli', 'Guhagar', 'Khed'],
    'Nagar Panchayats': ['Mandangad', 'Sangameshwar', 'Lanja', 'Rajapur', 'Devrukh']
  },

  // 28. Sangli District
  'Sangli': {
    'Municipal Corporations': ['Sangli–Miraj–Kupwad'],
    'Municipal Councils': ['Tasgaon', 'Islampur', 'Vita', 'Shirala', 'Kavathemahankal', 'Palus'],
    'Nagar Panchayats': ['Walwa', 'Jat', 'Khanapur', 'Atpadi', 'Tasgaon']
  },

  // 29. Satara District
  'Satara': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Satara', 'Karad', 'Wai', 'Phaltan', 'Lonand', 'Mahabaleshwar', 'Panchgani', 'Satara Cantonment'],
    'Nagar Panchayats': ['Koregaon', 'Mhaswad', 'Pusegaon', 'Rahimatpur', 'Khatav', 'Medha']
  },

  // 30. Sindhudurg District
  'Sindhudurg': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Vengurla', 'Malwan', 'Sawantwadi', 'Kudal', 'Kankavli'],
    'Nagar Panchayats': ['Devgad', 'Vaibhavwadi', 'Dodamarg', 'Achara']
  },

  // 31. Solapur District
  'Solapur': {
    'Municipal Corporations': ['Solapur'],
    'Municipal Councils': ['Barshi', 'Pandharpur', 'Akkalkot', 'Karmala', 'Mangalvedhe', 'Malshiras', 'Solapur Cantonment'],
    'Nagar Panchayats': ['Mohol', 'Akluj', 'Sangola', 'Madha', 'Velapur', 'Vairag']
  },

  // 32. Thane District
  'Thane': {
    'Municipal Corporations': ['Thane', 'Navi Mumbai', 'Kalyan–Dombivli', 'Mira–Bhayandar', 'Bhiwandi–Nizampur', 'Ulhasnagar'],
    'Municipal Councils': ['Ambernath', 'Badlapur', 'Shahapur', 'Murbad', 'Vasai', 'Virar', 'Nalasopara', 'Palghar'],
    'Nagar Panchayats': ['Khardi', 'Titwala', 'Khadavli', 'Shilphata', 'Kharbav', 'Vangani']
  },

  // 33. Wardha District
  'Wardha': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Wardha', 'Hinganghat', 'Arvi', 'Karanja'],
    'Nagar Panchayats': ['Ashti', 'Deoli', 'Pulgaon', 'Samudrapur', 'Seloo']
  },

  // 34. Washim District
  'Washim': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Washim', 'Karanja', 'Malegaon', 'Risod'],
    'Nagar Panchayats': ['Mangrulpir', 'Manora', 'Ansing']
  },

  // 35. Yavatmal District
  'Yavatmal': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Yavatmal', 'Pusad', 'Wani', 'Arni', 'Darwha', 'Digras'],
    'Nagar Panchayats': ['Ghatanji', 'Maregaon', 'Kelapur', 'Ralegaon', 'Umarkhed', 'Pandharkawada']
  },

  // 36. Nandurbar District (Added - was missing)
  'Nandurbar': {
    'Municipal Corporations': [],
    'Municipal Councils': ['Nandurbar', 'Shahada', 'Navapur'],
    'Nagar Panchayats': ['Taloda', 'Akkalkuwa', 'Dhadgaon']
  }
};

// City to District mapping (for Municipal Corporations)
export const cityToDistrict: Record<string, string> = {
  // Municipal Corporations mapped to their districts
  'Ahmednagar': 'Ahmednagar',
  'Akola': 'Akola',
  'Amravati': 'Amravati',
  'Aurangabad': 'Aurangabad',
  'Chandrapur': 'Chandrapur',
  'Dhule': 'Dhule',
  'Ichalkaranji': 'Kolhapur',
  'Jalgaon': 'Jalgaon',
  'Jalna': 'Jalna',
  'Kolhapur': 'Kolhapur',
  'Latur': 'Latur',
  'Malegaon': 'Nashik',
  'Mumbai': 'Mumbai',
  'Nagpur': 'Nagpur',
  'Nanded–Waghala': 'Nanded',
  'Nashik': 'Nashik',
  'Navi Mumbai': 'Thane',
  'Panvel': 'Raigad',
  'Parbhani': 'Parbhani',
  'Pimpri–Chinchwad': 'Pune',
  'Pune': 'Pune',
  'Sangli–Miraj–Kupwad': 'Sangli',
  'Solapur': 'Solapur',
  'Thane': 'Thane',
  'Kalyan–Dombivli': 'Thane',
  'Mira–Bhayandar': 'Thane',
  'Bhiwandi–Nizampur': 'Thane',
  'Ulhasnagar': 'Thane',
  'Vasai–Virar': 'Palghar'
};