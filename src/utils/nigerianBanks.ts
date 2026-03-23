export interface NigerianBank {
  name: string;
  code: string;
  sortCode?: string;
  type: 'commercial' | 'microfinance' | 'merchant' | 'development' | 'non-interest' | 'mortgage';
  website?: string;
  established?: number;
}

export const nigerianBanks: NigerianBank[] = [
  // Commercial Banks
  {
    name: "Access Bank Plc",
    code: "044",
    sortCode: "044150149",
    type: "commercial",
    website: "https://www.accessbankplc.com",
    established: 1989
  },
  {
    name: "Citibank Nigeria Limited",
    code: "023",
    sortCode: "023150005",
    type: "commercial",
    website: "https://www.citibank.com.ng",
    established: 1984
  },
  {
    name: "Diamond Bank Plc",
    code: "063",
    sortCode: "063150162",
    type: "commercial",
    website: "https://www.diamondbank.com",
    established: 1991
  },
  {
    name: "Ecobank Nigeria Plc",
    code: "050",
    sortCode: "050150010",
    type: "commercial",
    website: "https://www.ecobank.com/ng",
    established: 1989
  },
  {
    name: "Fidelity Bank Plc",
    code: "070",
    sortCode: "070150003",
    type: "commercial",
    website: "https://www.fidelitybank.ng",
    established: 1988
  },
  {
    name: "First Bank of Nigeria Limited",
    code: "011",
    sortCode: "011150001",
    type: "commercial",
    website: "https://www.firstbanknigeria.com",
    established: 1894
  },
  {
    name: "First City Monument Bank Limited",
    code: "214",
    sortCode: "214150018",
    type: "commercial",
    website: "https://www.fcmb.com",
    established: 1982
  },
  {
    name: "Guaranty Trust Bank Plc",
    code: "058",
    sortCode: "058150041",
    type: "commercial",
    website: "https://www.gtbank.com",
    established: 1990
  },
  {
    name: "Heritage Bank Plc",
    code: "030",
    sortCode: "030150001",
    type: "commercial",
    website: "https://www.heritage.ng",
    established: 2012
  },
  {
    name: "Keystone Bank Limited",
    code: "082",
    sortCode: "082150017",
    type: "commercial",
    website: "https://www.keystonebankng.com",
    established: 2011
  },
  {
    name: "Kuda Bank",
    code: "50211",
    sortCode: "502110001",
    type: "commercial",
    website: "https://kuda.com",
    established: 2019
  },
  {
    name: "Opay",
    code: "999991",
    sortCode: "999991001",
    type: "commercial",
    website: "https://opay.ng",
    established: 2018
  },
  {
    name: "PalmPay",
    code: "999992",
    sortCode: "999992001",
    type: "commercial",
    website: "https://palmpay.com",
    established: 2019
  },
  {
    name: "Polaris Bank Limited",
    code: "076",
    sortCode: "076150006",
    type: "commercial",
    website: "https://www.polarisbanklimited.com",
    established: 2018
  },
  {
    name: "Providus Bank Limited",
    code: "101",
    sortCode: "101150001",
    type: "commercial",
    website: "https://www.providusbank.com",
    established: 2016
  },
  {
    name: "Stanbic IBTC Bank Plc",
    code: "221",
    sortCode: "221150001",
    type: "commercial",
    website: "https://www.stanbicibtcbank.com",
    established: 1989
  },
  {
    name: "Standard Chartered Bank Nigeria Limited",
    code: "068",
    sortCode: "068150015",
    type: "commercial",
    website: "https://www.sc.com/ng",
    established: 1992
  },
  {
    name: "Sterling Bank Plc",
    code: "232",
    sortCode: "232150016",
    type: "commercial",
    website: "https://www.sterling.ng",
    established: 1960
  },
  {
    name: "Suntrust Bank Nigeria Limited",
    code: "100",
    sortCode: "100150001",
    type: "commercial",
    website: "https://www.suntrustng.com",
    established: 2015
  },
  {
    name: "Union Bank of Nigeria Plc",
    code: "032",
    sortCode: "032150001",
    type: "commercial",
    website: "https://www.unionbankng.com",
    established: 1917
  },
  {
    name: "United Bank for Africa Plc",
    code: "033",
    sortCode: "033150001",
    type: "commercial",
    website: "https://www.ubagroup.com",
    established: 1949
  },
  {
    name: "Unity Bank Plc",
    code: "215",
    sortCode: "215150001",
    type: "commercial",
    website: "https://www.unitybankng.com",
    established: 2006
  },
  {
    name: "VFD Microfinance Bank Limited",
    code: "566",
    sortCode: "566150001",
    type: "microfinance",
    website: "https://www.vfdgroup.com",
    established: 2008
  },
  {
    name: "Wema Bank Plc",
    code: "035",
    sortCode: "035150001",
    type: "commercial",
    website: "https://www.wemabank.com",
    established: 1945
  },
  {
    name: "Zenith Bank Plc",
    code: "057",
    sortCode: "057150001",
    type: "commercial",
    website: "https://www.zenithbank.com",
    established: 1990
  },

  // Microfinance Banks
  {
    name: "AB Microfinance Bank",
    code: "090",
    sortCode: "090150001",
    type: "microfinance",
    website: "https://www.ab-mfb.com",
    established: 2008
  },
  {
    name: "Aella Credit",
    code: "090001",
    sortCode: "090001001",
    type: "microfinance",
    website: "https://aella.co",
    established: 2015
  },
  {
    name: "Ampersand Microfinance Bank",
    code: "090002",
    sortCode: "090002001",
    type: "microfinance",
    website: "https://ampersandmfbank.com",
    established: 2010
  },
  {
    name: "Carbon (Paylater)",
    code: "090003",
    sortCode: "090003001",
    type: "microfinance",
    website: "https://getcarbon.co",
    established: 2016
  },
  {
    name: "Fairmoney Microfinance Bank",
    code: "090004",
    sortCode: "090004001",
    type: "microfinance",
    website: "https://fairmoney.ng",
    established: 2017
  },
  {
    name: "Kredi Money Microfinance Bank",
    code: "090005",
    sortCode: "090005001",
    type: "microfinance",
    website: "https://kredimoney.com",
    established: 2018
  },
  {
    name: "Lagos Building Investment Company Plc",
    code: "090006",
    sortCode: "090006001",
    type: "microfinance",
    website: "https://www.lbicplc.com",
    established: 1980
  },
  {
    name: "Mayfair Microfinance Bank",
    code: "090007",
    sortCode: "090007001",
    type: "microfinance",
    website: "https://mayfairmfb.com",
    established: 2010
  },
  {
    name: "Mint Microfinance Bank",
    code: "090008",
    sortCode: "090008001",
    type: "microfinance",
    website: "https://mintmfb.com",
    established: 2012
  },
  {
    name: "Page Microfinance Bank",
    code: "090009",
    sortCode: "090009001",
    type: "microfinance",
    website: "https://pagemfb.com",
    established: 2014
  },
  {
    name: "Parkway Microfinance Bank",
    code: "090010",
    sortCode: "090010001",
    type: "microfinance",
    website: "https://parkwaymfb.com",
    established: 2011
  },
  {
    name: "Personal Trust Microfinance Bank",
    code: "090011",
    sortCode: "090011001",
    type: "microfinance",
    website: "https://personaltmfb.com",
    established: 2013
  },
  {
    name: "Petra Microfinance Bank",
    code: "090012",
    sortCode: "090012001",
    type: "microfinance",
    website: "https://petramfb.com",
    established: 2015
  },
  {
    name: "Quickfund Microfinance Bank",
    code: "090013",
    sortCode: "090013001",
    type: "microfinance",
    website: "https://quickfundmfb.com",
    established: 2016
  },
  {
    name: "Sparkle Microfinance Bank",
    code: "090014",
    sortCode: "090014001",
    type: "microfinance",
    website: "https://sparkle.ng",
    established: 2019
  },
  {
    name: "Tangerine Money",
    code: "090015",
    sortCode: "090015001",
    type: "microfinance",
    website: "https://tangerine.ng",
    established: 2018
  },
  {
    name: "VFD Microfinance Bank",
    code: "090016",
    sortCode: "090016001",
    type: "microfinance",
    website: "https://vfdgroup.com",
    established: 2008
  },

  // Non-Interest Banks
  {
    name: "Jaiz Bank Plc",
    code: "301",
    sortCode: "301150001",
    type: "non-interest",
    website: "https://www.jaizbank.com",
    established: 2012
  },
  {
    name: "TajBank Limited",
    code: "302",
    sortCode: "302150001",
    type: "non-interest",
    website: "https://www.tajbank.com",
    established: 2019
  },
  {
    name: "Lotus Bank",
    code: "303",
    sortCode: "303150001",
    type: "non-interest",
    website: "https://www.lotusbank.com",
    established: 2021
  },

  // Development Banks
  {
    name: "Bank of Industry Limited",
    code: "001",
    sortCode: "001150001",
    type: "development",
    website: "https://www.boi.ng",
    established: 1959
  },
  {
    name: "Development Bank of Nigeria",
    code: "002",
    sortCode: "002150001",
    type: "development",
    website: "https://www.devbankng.com",
    established: 2014
  },

  // Merchant Banks
  {
    name: "Coronation Merchant Bank",
    code: "559",
    sortCode: "559150001",
    type: "merchant",
    website: "https://www.coronationmb.com",
    established: 2015
  },
  {
    name: "FBNQuest Merchant Bank",
    code: "560",
    sortCode: "560150001",
    type: "merchant",
    website: "https://www.fbnquest.com",
    established: 2015
  },
  {
    name: "Nova Merchant Bank",
    code: "561",
    sortCode: "561150001",
    type: "merchant",
    website: "https://www.novamb.com",
    established: 2017
  },
  {
    name: "Rand Merchant Bank Nigeria",
    code: "562",
    sortCode: "562150001",
    type: "merchant",
    website: "https://www.rmb.com.ng",
    established: 2016
  }
];
