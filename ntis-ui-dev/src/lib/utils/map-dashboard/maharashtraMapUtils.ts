export interface LabelPosition {
  x: number;
  y: number;
  size?: number;
}

export function getLabelPosition(districtId: string): LabelPosition {
  const positions: Record<
    string,
    { x: number; y: number; size?: number }
  > = {
    // Konkan Division - West Coast
    sindhudurg: { x: 130, y: 620, size: 10 },
    ratnagiri: { x: 108, y: 520, size: 10 },
    raigad: { x: 78, y: 400, size: 10 },
    mumbaicity: { x: 20, y: 360, size: 8 },
    "mumbaisub.": { x: 10, y: 335, size: 8 },
    thane: { x: 100, y: 310, size: 10 },
    palghar: { x: 70, y: 270, size: 10 },

    // Nashik Division
    nandurbar: { x: 185, y: 60, size: 10 },
    dhule: { x: 220, y: 130, size: 10 },
    jalgaon: { x: 310, y: 135, size: 10 },
    nashik: { x: 165, y: 220, size: 11 },
    ahmednagar: { x: 235, y: 315, size: 10 },

    // Pune Division
    pune: { x: 155, y: 390, size: 11 },
    satara: { x: 185, y: 495, size: 10 },
    sangli: { x: 225, y: 545, size: 10 },
    kolhapur: { x: 175, y: 595, size: 10 },
    solapur: { x: 305, y: 475, size: 11 },

    // Aurangabad Division
    aurangabad: { x: 285, y: 240, size: 10 },
    jalna: { x: 360, y: 280, size: 10 },
    beed: { x: 350, y: 350, size: 10 },
    parbhani: { x: 425, y: 320, size: 10 },
    hingoli: { x: 480, y: 290, size: 9 },
    nanded: { x: 508, y: 350, size: 10 },
    latur: { x: 440, y: 415, size: 10 },
    osmanabad: { x: 395, y: 465, size: 10 },

    // Amravati Division
    buldhana: { x: 400, y: 190, size: 10 },
    akola: { x: 465, y: 165, size: 10 },
    washim: { x: 475, y: 220, size: 10 },
    amravati: { x: 520, y: 125, size: 10 },
    yavatmal: { x: 575, y: 230, size: 10 },

    // Nagpur Division
    nagpur: { x: 665, y: 130, size: 11 },
    wardha: { x: 625, y: 175, size: 10 },
    bhandara: { x: 740, y: 130, size: 10 },
    gondia: { x: 785, y: 110, size: 10 },
    chandrapur: { x: 700, y: 230, size: 10 },
    gadchiroli: { x: 775, y: 285, size: 10 },
  };

  return positions[districtId] || { x: 400, y: 312, size: 10 };
}
