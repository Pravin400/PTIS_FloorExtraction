/* eslint-disable @typescript-eslint/no-explicit-any */
export const HARDCODED_ASSET_DATA: any = {
  LAND: {
    label: "Land Assets",
    types: {
      OPEN_PLOT: {
        label: "Open Plot",
        fields: [
          { name: "PlotNumber", label: "Plot Number", type: "text" },
          { name: "Unit", label: "Unit", type: "select", options: ["Sq.m", "Sq.ft"] },
          { name: "LandShape", label: "Land Shape", type: "select", options: ["Square", "Rectangular", "L-Shape", "Irregular"] },
          { name: "SurveyNumber", label: "CTS / Survey Number", type: "text" },
          { name: "VillageMoujeName", label: "Village / Mouje Name", type: "text" },
          { name: "RevenueCircleOffice", label: "Revenue Circle / Office", type: "text" },
          { name: "LandClassification", label: "Land Classification", type: "select", options: ["Agricultural", "Non-Agricultural", "Forest", "NA-Industrial"] },
          { name: "EncumbranceStatus", label: "Encumbrance Status", type: "select", options: ["Free", "Mortgaged", "Disputed"] },
          { name: "PlotBoundaryType", label: "Plot Boundary Type", type: "select", options: ["Fenced", "Open", "Compound Wall"] }
        ],
        documents: ["7/12 Extract", "Property Card", "Sale Deed", "Layout Plan", "GIS Map", "Encumbrance Certificate"]
      },
      VACANT_LAND: {
        label: "Vacant Land",
        fields: [
          { name: "PlotNumber", label: "Plot Number", type: "text" },
          { name: "Unit", label: "Unit", type: "select", options: ["Sq.m", "Sq.ft"] },
          { name: "LandShape", label: "Land Shape", type: "select", options: ["Square", "Rectangular", "L-Shape", "Irregular"] }
        ],
        documents: ["7/12 Extract", "Property Card", "Sale Deed"]
      },
      RESERVED_LAND: {
        label: "Reserved Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "landLength", label: "Land Length (m)", type: "number" },
          { name: "landWidth", label: "Land Width (m)", type: "number" },
          { name: "reservedPurpose", label: "Reserved Purpose", type: "text" },
          { name: "authorityName", label: "Authority Name", type: "text" },
          { name: "notificationDate", label: "Notification Date", type: "date" },
          { name: "currentUsage", label: "Current Usage", type: "text" },
          { name: "encroachmentStatus", label: "Encroachment Status", type: "select", options: ["None", "Partial", "Full"] }
        ],
        documents: ["Reservation Notification", "Development Plan Extract", "7/12 Extract", "Authority Approval Letter", "Land Record Map"]
      },
      ENCROACHED_LAND: {
        label: "Encroached Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "encroacherName", label: "Encroacher Name", type: "text" },
          { name: "encroachmentType", label: "Encroachment Type", type: "text" },
          { name: "encroachmentArea", label: "Encroachment Area (sqm)", type: "number" },
          { name: "legalStatus", label: "Legal Status", type: "select", options: ["Pending", "In Court", "Resolved"] },
          { name: "noticeIssued", label: "Notice Issued", type: "checkbox" },
          { name: "evictionStatus", label: "Eviction Status", type: "text" },
          { name: "currentUsage", label: "Current Usage", type: "text" }
        ],
        documents: ["Encroachment Report", "Notice Copy", "Survey Report", "Photographic Evidence", "Legal Case Documents"]
      },
      AGRICULTURAL_LAND: {
        label: "Agricultural Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "soilType", label: "Soil Type", type: "text" },
          { name: "waterSource", label: "Water Source", type: "text" },
          { name: "cropType", label: "Crop Type", type: "text" },
          { name: "irrigationType", label: "Irrigation Type", type: "text" },
          { name: "annualYield", label: "Annual Yield", type: "number" },
          { name: "currentUsage", label: "Current Usage", type: "text" }
        ],
        documents: ["7/12 Extract", "Crop Record", "Irrigation Record", "Soil Report", "Land Ownership Document"]
      },
      COMMERCIAL_LAND: {
        label: "Commercial Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "zoningType", label: "Zoning Type", type: "text" },
          { name: "commercialUseType", label: "Commercial Use Type", type: "text" },
          { name: "leaseStatus", label: "Lease Status", type: "select", options: ["Active", "Expired", "None"] },
          { name: "tenantDetails", label: "Tenant Details", type: "text" },
          { name: "rentalIncome", label: "Rental Income", type: "number" },
          { name: "marketValue", label: "Market Value", type: "number" }
        ],
        documents: ["Sale Deed", "Lease Agreement", "Property Tax Record", "Zoning Approval", "Rental Agreement"]
      },
      RESIDENTIAL_LAND: {
        label: "Residential Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "layoutApprovalStatus", label: "Layout Approval Status", type: "select", options: ["Approved", "Pending", "Rejected"] },
          { name: "plotCount", label: "Plot Count", type: "number" },
          { name: "allotmentStatus", label: "Allotment Status", type: "text" },
          { name: "occupancyStatus", label: "Occupancy Status", type: "select", options: ["Occupied", "Vacant"] },
          { name: "marketValue", label: "Market Value", type: "number" }
        ],
        documents: ["Layout Approval", "7/12 Extract", "Allotment Letter", "Property Card", "Development Permission"]
      },
      INDUSTRIAL_LAND: {
        label: "Industrial Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "industrialZoneType", label: "Industrial Zone Type", type: "text" },
          { name: "industryType", label: "Industry Type", type: "text" },
          { name: "pollutionCategory", label: "Pollution Category", type: "select", options: ["Red", "Orange", "Green", "White"] },
          { name: "leaseStatus", label: "Lease Status", type: "text" },
          { name: "tenantDetails", label: "Tenant Details", type: "text" },
          { name: "infrastructureAvailability", label: "Infrastructure Availability", type: "text" }
        ],
        documents: ["Industrial Approval Certificate", "Pollution Control NOC", "Lease Agreement", "Land Allotment Letter", "Factory License"]
      },
      GARDEN_PARK: {
        label: "Garden/Park Land",
        fields: [
          { name: "surveyNumber", label: "Survey Number", type: "text" },
          { name: "landArea", label: "Land Area (sqm)", type: "number" },
          { name: "parkName", label: "Park Name", type: "text" },
          { name: "treeCount", label: "Tree Count", type: "number" },
          { name: "facilitiesAvailable", label: "Facilities Available", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "publicAccess", label: "Public Access", type: "checkbox" },
          { name: "waterSource", label: "Water Source", type: "text" }
        ],
        documents: ["Survey Map", "Encroachment Report", "Usage Permission", "Municipal Approval"]
      }
    }
  },
  BUILDING: {
    label: "Building Assets",
    types: {
      MUNICIPAL_OFFICE: {
        label: "Municipal Office",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "serviceType", label: "Service Type", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "waterConnection", label: "Water Connection", type: "checkbox" },
          { name: "electricityConnectionNo", label: "Electricity Connection No", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record", "Electricity Bill", "Water Bill"]
      },
      HOSPITAL: {
        label: "Hospital",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "serviceType", label: "Service Type", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "waterConnection", label: "Water Connection", type: "checkbox" },
          { name: "electricityConnectionNo", label: "Electricity Connection No", type: "text" }
        ],
        documents: ["Hospital License", "Fire NOC", "Health Department Approval", "Biomedical Waste Certificate", "Building Completion Certificate"]
      },
      SCHOOL: {
        label: "School/Educational Institution",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "constructionYear", label: "Construction Year", type: "number" },
          { name: "schoolType", label: "School Type", type: "select", options: ["Primary", "Secondary", "Higher Secondary"] },
          { name: "studentCapacity", label: "Student Capacity", type: "number" },
          { name: "playgroundAvailable", label: "Playground Available", type: "checkbox" }
        ],
        documents: ["School Recognition Certificate", "Building Safety Certificate", "Fire NOC", "Sanitation Certificate", "Approval from Education Board"]
      },
      DISPENSARY: {
        label: "Dispensary",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "serviceType", label: "Service Type", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "waterConnection", label: "Water Connection", type: "checkbox" },
          { name: "electricityConnectionNo", label: "Electricity Connection No", type: "text" }
        ],
        documents: ["Health Department License", "Building Completion Certificate", "Fire NOC", "Sanitation Certificate"]
      },
      COMMUNITY_HALL: {
        label: "Community Hall",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "seatingCapacity", label: "Seating Capacity", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record", "Fire NOC"]
      },
      WARD_OFFICE: {
        label: "Ward Office",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "serviceType", label: "Service Type", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "waterConnection", label: "Water Connection", type: "checkbox" },
          { name: "electricityConnectionNo", label: "Electricity Connection No", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record", "Electricity Bill"]
      },
      STAFF_QUARTERS: {
        label: "Staff Quarters",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfUnits", label: "No Of Units", type: "number" },
          { name: "occupancyStatus", label: "Occupancy Status", type: "select", options: ["Occupied", "Vacant"] },
          { name: "allottedTo", label: "Allotted To", type: "text" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "constructionYear", label: "Construction Year", type: "number" }
        ],
        documents: ["Allotment Letter", "Occupancy Certificate", "Property Tax Record", "Building Completion Certificate"]
      },
      PUBLIC_TOILET: {
        label: "Public Toilet",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfSeats", label: "No Of Seats", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "waterConnection", label: "Water Connection", type: "checkbox" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" },
          { name: "operatingHours", label: "Operating Hours", type: "text" }
        ],
        documents: ["Building Completion Certificate", "Water Connection Record", "Sanitation Certificate"]
      },
      LIBRARY: {
        label: "Library",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "bookCapacity", label: "Book Capacity", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record"]
      },
      FIRE_STATION: {
        label: "Fire Station",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "vehicleCapacity", label: "Vehicle Capacity", type: "number" },
          { name: "operatingHours", label: "Operating Hours", type: "text" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Fire Equipment Certificate"]
      },
      SPORTS_COMPLEX: {
        label: "Sports Complex",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "sportsFacilities", label: "Sports Facilities", type: "text" },
          { name: "seatingCapacity", label: "Seating Capacity", type: "number" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record", "Sports Authority Approval"]
      },
      SHOPPING_COMPLEX: {
        label: "Shopping Complex",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "shopCount", label: "Shop Count", type: "number" },
          { name: "totalFloors", label: "Total Floors", type: "number" },
          { name: "occupancyStatus", label: "Occupancy Status", type: "select", options: ["Occupied", "Vacant", "Partial"] },
          { name: "rentalIncome", label: "Rental Income (Monthly)", type: "number" },
          { name: "leaseType", label: "Lease Type", type: "select", options: ["Monthly", "Yearly", "Long-Term"] },
          { name: "builtUpArea", label: "Built Up Area (SqM)", type: "number" },
          { name: "parkingAvailable", label: "Parking Available", type: "checkbox" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Trade License", "Lease Agreement", "Shops Allotment List", "Property Tax Record", "Fire NOC", "Building Completion Certificate"]
      },
      RESIDENTIAL_SOCIETY: {
        label: "Residential Society",
        fields: [
          { name: "societyName", label: "Society Name", type: "text" },
          { name: "societyRegistrationNo", label: "Society Registration No", type: "text" },
          { name: "noOfBuildings", label: "No Of Buildings", type: "number" },
          { name: "noOfFlats", label: "Total No Of Flats", type: "number" },
          { name: "noOfFloors", label: "No Of Floors Per Building", type: "number" },
          { name: "builtUpArea", label: "Total Built Up Area (SqM)", type: "number" },
          { name: "plotArea", label: "Plot Area (SqM)", type: "number" },
          { name: "constructionYear", label: "Construction Year", type: "number" },
          { name: "maintenanceAgency", label: "Maintenance Agency / RWA", type: "text" },
          { name: "parkingType", label: "Parking Type", type: "select", options: ["Open", "Covered", "Stilt", "Basement", "None"] },
          { name: "liftAvailable", label: "Lift Available", type: "checkbox" },
          { name: "waterSupplyType", label: "Water Supply Type", type: "select", options: ["Municipal", "Borewell", "Both"] },
          { name: "amenities", label: "Amenities", type: "text" }
        ],
        documents: ["Society Registration Certificate", "Building Completion Certificate", "Occupancy Certificate", "Property Card", "Layout Plan Approval", "Fire NOC", "Electrical Inspection Certificate"]
      },
      SEMI_COMMERCIAL: {
        label: "Semi-Commercial Building",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "residentialFloors", label: "Residential Floors", type: "number" },
          { name: "commercialFloors", label: "Commercial Floors", type: "number" },
          { name: "residentialUnits", label: "No Of Residential Units", type: "number" },
          { name: "commercialUnits", label: "No Of Commercial Units/Shops", type: "number" },
          { name: "totalBuiltUpArea", label: "Total Built Up Area (SqM)", type: "number" },
          { name: "residentialArea", label: "Residential Area (SqM)", type: "number" },
          { name: "commercialArea", label: "Commercial Area (SqM)", type: "number" },
          { name: "constructionYear", label: "Construction Year", type: "number" },
          { name: "occupancyStatus", label: "Occupancy Status", type: "select", options: ["Occupied", "Partial", "Vacant"] },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Occupancy Certificate", "Property Tax Record", "Fire NOC", "Trade License (for commercial portion)"]
      },
      OTHER: {
        label: "Other",
        fields: [
          { name: "buildingName", label: "Building Name", type: "text" },
          { name: "noOfFloors", label: "No Of Floors", type: "number" },
          { name: "builtUpArea", label: "Built Up Area", type: "number" },
          { name: "constructionYear", label: "Construction Year", type: "number" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Building Plan Approval", "Completion Certificate", "Property Tax Record"]
      }
    }
  },
  INFRASTRUCTURE: {
    label: "Infrastructure Assets",
    types: {
      ROADS: {
        label: "Roads",
        sections: [
          {
            id: "sec_r1",
            label: "Physical Specifications",
            fields: [
              { name: "roadName", label: "Road Name", type: "text" },
              { name: "roadLength", label: "Road Length (km)", type: "number" },
              { name: "roadWidth", label: "Road Width (m)", type: "number" },
              { name: "surfaceType", label: "Surface Type", type: "select", options: ["Concrete", "Asphalt", "Dirt", "Gravel"] }
            ]
          },
          {
            id: "sec_r2",
            label: "Traffic & Maintenance",
            fields: [
              { name: "trafficDensity", label: "Traffic Density", type: "select", options: ["High", "Medium", "Low"] },
              { name: "lastMaintenanceDate", label: "Last Maintenance Date", type: "date" }
            ]
          }
        ],
        documents: ["Work Order", "DPR (Detailed Project Report)", "Completion Certificate", "Contract Agreement", "Maintenance Log"]
      },
      WATER_SUPPLY: {
        label: "Water Supply",
        sections: [
          {
            id: "sec_ws1",
            label: "Pipeline Details",
            fields: [
              { name: "pipelineLength", label: "Pipeline Length (m)", type: "number" },
              { name: "diameter", label: "Diameter (mm)", type: "number" },
              { name: "materialType", label: "Material Type", type: "text" }
            ]
          },
          {
            id: "sec_ws2",
            label: "Supply & Capacity",
            fields: [
              { name: "waterSource", label: "Water Source", type: "text" },
              { name: "supplyCapacity", label: "Supply Capacity (MLD)", type: "number" },
              { name: "lastInspectionDate", label: "Last Inspection Date", type: "date" }
            ]
          }
        ],
        documents: ["Pipeline Layout Map", "Work Order", "Completion Certificate", "Water Testing Report", "Maintenance Record"]
      },
      SEWERAGE_DRAINAGE: {
        label: "Sewerage & Drainage",
        sections: [
          {
            id: "sec_sd1",
            label: "Drainage Specifications",
            fields: [
              { name: "drainType", label: "Drain Type", type: "select", options: ["Open Drain", "Closed Pipeline", "Storm Water"] },
              { name: "length", label: "Length (m)", type: "number" },
              { name: "width", label: "Width (m)", type: "number" }
            ]
          },
          {
            id: "sec_sd2",
            label: "Operational Status",
            fields: [
              { name: "flowCapacity", label: "Flow Capacity", type: "number" },
              { name: "blockageStatus", label: "Blockage Status", type: "select", options: ["Clear", "Partial", "Critical"] },
              { name: "lastCleaningDate", label: "Last Cleaning Date", type: "date" }
            ]
          }
        ],
        documents: ["Drainage Plan", "Work Completion Report", "Inspection Report", "Maintenance Log"]
      },
      ELECTRICAL: {
        label: "Electrical Infrastructure",
        sections: [
          {
            id: "sec_el1",
            label: "Asset Identification",
            fields: [
              { name: "poleId", label: "Pole ID / Transformer No", type: "text" },
              { name: "poleType", label: "Pole/Tower Type", type: "text" },
              { name: "lightType", label: "Light/Lamp Type", type: "select", options: ["LED", "Sodium Vapor", "Solar"] }
            ]
          },
          {
            id: "sec_el2",
            label: "Power Configuration",
            fields: [
              { name: "transformerCapacity", label: "Transformer Capacity (kVA)", type: "number" },
              { name: "powerLoad", label: "Power Load (kW)", type: "number" },
              { name: "lastMaintenanceDate", label: "Last Maintenance Date", type: "date" }
            ]
          }
        ],
        documents: ["Installation Report", "Electricity Board Approval", "Maintenance Log", "Safety Certificate"]
      },
      URBAN_ENVIRONMENT: {
        label: "Urban Environment",
        sections: [
          {
            id: "sec_ue1",
            label: "Park & Greenery Details",
            fields: [
              { name: "parkName", label: "Park/Garden Name", type: "text" },
              { name: "areaSize", label: "Area Size (sqm)", type: "number" },
              { name: "treeCount", label: "Tree Count", type: "number" }
            ]
          },
          {
            id: "sec_ue2",
            label: "Management",
            fields: [
              { name: "facilityAvailable", label: "Facilities Available", type: "text" },
              { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
            ]
          }
        ],
        documents: ["Development Plan", "Plantation Record", "Maintenance Agreement", "Inspection Report"]
      },
      WASTE_MANAGEMENT: {
        label: "Waste Management",
        sections: [
          {
            id: "sec_wm1",
            label: "Processing Details",
            fields: [
              { name: "wasteType", label: "Waste Type", type: "select", options: ["Solid", "Liquid", "Hazardous", "E-Waste"] },
              { name: "collectionFrequency", label: "Collection Frequency", type: "text" },
              { name: "processingMethod", label: "Processing Method", type: "text" }
            ]
          },
          {
            id: "sec_wm2",
            label: "Resource Allocation",
            fields: [
              { name: "capacity", label: "Capacity (Tons)", type: "number" },
              { name: "vehicleAssigned", label: "Vehicle Assigned", type: "text" }
            ]
          }
        ],
        documents: ["Waste Management License", "Vehicle Allocation Record", "Processing Plant Approval", "Inspection Report"]
      }
    }
  },
  MOVABLE: {
    label: "Movable Assets",
    types: {
      VEHICLES: {
        label: "Vehicles",
        sections: [
          {
            id: "sec_v1",
            label: "Registration & Identification",
            fields: [
              { name: "vehicleNo", label: "Vehicle Number", type: "text" },
              { name: "registrationNo", label: "Registration Number", type: "text" },
              { name: "driverAssigned", label: "Driver Assigned", type: "text" }
            ]
          },
          {
            id: "sec_v2",
            label: "Technical Specifications",
            fields: [
              { name: "engineNumber", label: "Engine Number", type: "text" },
              { name: "chassisNumber", label: "Chassis Number", type: "text" },
              { name: "fuelType", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric", "CNG"] }
            ]
          },
          {
            id: "sec_v3",
            label: "Compliance & Lifecycle",
            fields: [
              { name: "purchaseDate", label: "Purchase Date", type: "date" },
              { name: "insuranceExpiry", label: "Insurance Expiry", type: "date" },
              { name: "fitnessExpiry", label: "Fitness Expiry", type: "date" }
            ]
          }
        ],
        documents: ["RC Book", "Insurance Policy", "Fitness Certificate", "PUC Certificate", "Invoice/Purchase Bill"]
      },
      IT_ASSETS: {
        label: "IT Assets",
        sections: [
          {
            id: "sec_it1",
            label: "Device Identification",
            fields: [
              { name: "serialNumber", label: "Serial Number", type: "text" },
              { name: "brand", label: "Brand", type: "text" },
              { name: "model", label: "Model", type: "text" }
            ]
          },
          {
            id: "sec_it2",
            label: "Hardware Configuration",
            fields: [
              { name: "processor", label: "Processor", type: "text" },
              { name: "ram", label: "RAM", type: "text" },
              { name: "storage", label: "Storage", type: "text" }
            ]
          },
          {
            id: "sec_it3",
            label: "Support & Assignment",
            fields: [
              { name: "warrantyExpiry", label: "Warranty Expiry", type: "date" },
              { name: "assignedTo", label: "Assigned To", type: "text" }
            ]
          }
        ],
        documents: ["Purchase Invoice", "Warranty Card", "AMC Agreement", "Installation Report"]
      },
      OFFICE_EQUIPMENT: {
        label: "Office Equipment",
        fields: [
          { name: "itemType", label: "Item Type", type: "text" },
          { name: "quantity", label: "Quantity", type: "number" },
          { name: "condition", label: "Condition", type: "select", options: ["New", "Good", "Used", "Repair Required"] },
          { name: "assignedTo", label: "Assigned To", type: "text" },
          { name: "purchaseDate", label: "Purchase Date", type: "date" }
        ],
        documents: ["Purchase Invoice", "Warranty Card", "AMC Agreement", "Installation Report"]
      },
      MACHINERY_TOOLS: {
        label: "Machinery & Tools",
        fields: [
          { name: "machineType", label: "Machine Type", type: "text" },
          { name: "capacity", label: "Capacity", type: "text" },
          { name: "manufacturer", label: "Manufacturer", type: "text" },
          { name: "purchaseDate", label: "Purchase Date", type: "date" },
          { name: "serviceDate", label: "Last Service Date", type: "date" },
          { name: "operatorAssigned", label: "Operator Assigned", type: "text" }
        ],
        documents: ["Invoice/Warranty", "Insurance Card", "AMC Agreement", "Installation Report"]
      },
      MISCELLANEOUS: {
        label: "Miscellaneous",
        fields: [
          { name: "itemDescription", label: "Item Description", type: "text" },
          { name: "quantity", label: "Quantity", type: "number" },
          { name: "condition", label: "Condition", type: "text" },
          { name: "remarks", label: "Remarks", type: "text" }
        ],
        documents: ["Purchase Invoice", "Warranty Document", "Stock Register Entry"]
      },
      CCTV_CAMERAS: {
        label: "CCTV Cameras",
        fields: [
          { name: "cameraType", label: "Camera Type", type: "text" },
          { name: "resolution", label: "Resolution", type: "text" },
          { name: "storageType", label: "Storage Type", type: "text" },
          { name: "installationDate", label: "Installation Date", type: "date" },
          { name: "vendorName", label: "Vendor Name", type: "text" },
          { name: "ipAddress", label: "IP Address", type: "text" }
        ],
        documents: ["Purchase Record", "Stock Entry", "Usage Log"]
      },
      IOT_SENSORS: {
        label: "IoT Sensors",
        fields: [
          { name: "sensorType", label: "Sensor Type", type: "text" },
          { name: "sensorModel", label: "Sensor Model", type: "text" },
          { name: "frequency", label: "Frequency", type: "text" },
          { name: "connectivityType", label: "Connectivity Type", type: "text" },
          { name: "batteryStatus", label: "Battery Status", type: "text" },
          { name: "installationDate", label: "Installation Date", type: "date" }
        ],
        documents: ["Installation Report", "AMC Agreement", "Vendor Contact", "Network Configuration Document"]
      },
      TRAFFIC_SIGNALS: {
        label: "Traffic Signals",
        fields: [
          { name: "signalType", label: "Signal Type", type: "text" },
          { name: "noOfTimers", label: "No Of Timers", type: "number" },
          { name: "powerBackup", label: "Power Backup", type: "checkbox" },
          { name: "operationalHours", label: "Operational Hours", type: "text" },
          { name: "installationDate", label: "Installation Date", type: "date" },
          { name: "maintenanceAgency", label: "Maintenance Agency", type: "text" }
        ],
        documents: ["Installation Certificate", "Service Agreement", "Calibration Report", "Maintenance Log"]
      }
    }
  }
};

/**
 * Helper to find the configuration for a given category and type.
 * Handles cases where the category/type might be an ID, a code, or a label.
 */
export function getAssetConfig(category: string, assetType: string) {
  if (!category) return null;

  // 1. Find Category
  let categoryKey = category.toUpperCase();
  let categoryData = HARDCODED_ASSET_DATA[categoryKey];

  if (!categoryData) {
    // Try to find by label or partial match
    categoryKey = Object.keys(HARDCODED_ASSET_DATA).find(key => {
      const labelUpper = HARDCODED_ASSET_DATA[key].label.toUpperCase();
      const catUpper = category.toUpperCase();
      
      const cleanCat = catUpper.replace(/S$/, "").replace(/ASSETS$/, "").trim();
      const cleanLabel = labelUpper.replace(/S$/, "").replace(/ASSETS$/, "").trim();
      const cleanKey = key.replace(/S$/, "").replace(/ASSETS$/, "").trim();
      
      return (
        cleanLabel === cleanCat ||
        cleanKey === cleanCat ||
        cleanLabel.includes(cleanCat) ||
        cleanCat.includes(cleanLabel) ||
        cleanCat.includes(cleanKey)
      );
    }) || "";
    categoryData = HARDCODED_ASSET_DATA[categoryKey];
  }


  if (!categoryData) return null;

  // 2. Find Type
  if (!assetType) return { categoryData, typeData: null, categoryKey };

  let typeKey = assetType.toUpperCase().replace(/\s+/g, '_');
  let typeData = categoryData.types[typeKey];

  if (!typeData) {
    // Try to find by label or partial match
    typeKey = Object.keys(categoryData.types).find(key =>
      key === assetType ||
      categoryData.types[key].label.toUpperCase() === assetType.toUpperCase() ||
      categoryData.types[key].label.toUpperCase().includes(assetType.toUpperCase())
    ) || "";
    typeData = categoryData.types[typeKey];
  }

  return {
    categoryData,
    typeData,
    categoryKey,
    typeKey,
    fields: typeData?.fields || [],
    sections: typeData?.sections || []
  };
}
