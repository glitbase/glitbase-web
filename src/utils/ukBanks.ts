export interface UKBank {
  name: string;
  sortCode: string;
  bankCode: string;
  type: 'retail' | 'investment' | 'building-society' | 'challenger' | 'international' | 'specialist';
  website?: string;
  established?: number;
  isAuthorized: boolean;
}

export const ukBanks: UKBank[] = [
  // Major Retail Banks
  {
    name: "Barclays Bank PLC",
    sortCode: "20-00-00",
    bankCode: "BARC",
    type: "retail",
    website: "https://www.barclays.co.uk",
    established: 1690,
    isAuthorized: true
  },
  {
    name: "HSBC Bank PLC",
    sortCode: "40-00-00",
    bankCode: "HBUK",
    type: "retail",
    website: "https://www.hsbc.co.uk",
    established: 1865,
    isAuthorized: true
  },
  {
    name: "Lloyds Bank PLC",
    sortCode: "30-00-00",
    bankCode: "LOYD",
    type: "retail",
    website: "https://www.lloydsbank.com",
    established: 1765,
    isAuthorized: true
  },
  {
    name: "NatWest Group PLC",
    sortCode: "60-00-00",
    bankCode: "NWBK",
    type: "retail",
    website: "https://www.natwest.com",
    established: 1968,
    isAuthorized: true
  },
  {
    name: "Royal Bank of Scotland",
    sortCode: "16-00-00",
    bankCode: "RBOS",
    type: "retail",
    website: "https://www.rbs.co.uk",
    established: 1727,
    isAuthorized: true
  },
  {
    name: "Santander UK PLC",
    sortCode: "09-00-00",
    bankCode: "ABBE",
    type: "retail",
    website: "https://www.santander.co.uk",
    established: 2010,
    isAuthorized: true
  },
  {
    name: "TSB Bank PLC",
    sortCode: "77-00-00",
    bankCode: "TSBS",
    type: "retail",
    website: "https://www.tsb.co.uk",
    established: 2013,
    isAuthorized: true
  },
  {
    name: "Virgin Money UK PLC",
    sortCode: "09-01-20",
    bankCode: "VMUK",
    type: "retail",
    website: "https://uk.virginmoney.com",
    established: 2018,
    isAuthorized: true
  },

  // Challenger Banks
  {
    name: "Monzo Bank Limited",
    sortCode: "04-00-04",
    bankCode: "MONZ",
    type: "challenger",
    website: "https://monzo.com",
    established: 2015,
    isAuthorized: true
  },
  {
    name: "Starling Bank Limited",
    sortCode: "60-83-71",
    bankCode: "STAR",
    type: "challenger",
    website: "https://www.starlingbank.com",
    established: 2014,
    isAuthorized: true
  },
  {
    name: "Revolut Ltd",
    sortCode: "23-69-72",
    bankCode: "REVO",
    type: "challenger",
    website: "https://www.revolut.com",
    established: 2015,
    isAuthorized: true
  },
  {
    name: "Chase (JP Morgan)",
    sortCode: "04-00-04",
    bankCode: "CHAS",
    type: "challenger",
    website: "https://www.chase.co.uk",
    established: 2021,
    isAuthorized: true
  },
  {
    name: "Zopa Bank Limited",
    sortCode: "04-00-04",
    bankCode: "ZOPA",
    type: "challenger",
    website: "https://www.zopa.com",
    established: 2020,
    isAuthorized: true
  },
  {
    name: "Atom Bank PLC",
    sortCode: "04-00-04",
    bankCode: "ATOM",
    type: "challenger",
    website: "https://www.atombank.co.uk",
    established: 2016,
    isAuthorized: true
  },
  {
    name: "Tide Platform Limited",
    sortCode: "04-00-04",
    bankCode: "TIDE",
    type: "challenger",
    website: "https://www.tide.co",
    established: 2015,
    isAuthorized: true
  },
  {
    name: "Mettle",
    sortCode: "04-00-04",
    bankCode: "METT",
    type: "challenger",
    website: "https://www.mettle.co.uk",
    established: 2018,
    isAuthorized: true
  },

  // Building Societies
  {
    name: "Nationwide Building Society",
    sortCode: "07-00-93",
    bankCode: "NATW",
    type: "building-society",
    website: "https://www.nationwide.co.uk",
    established: 1884,
    isAuthorized: true
  },
  {
    name: "Coventry Building Society",
    sortCode: "40-03-26",
    bankCode: "COVE",
    type: "building-society",
    website: "https://www.coventrybuildingsociety.co.uk",
    established: 1884,
    isAuthorized: true
  },
  {
    name: "Yorkshire Building Society",
    sortCode: "57-00-30",
    bankCode: "YORK",
    type: "building-society",
    website: "https://www.ybs.co.uk",
    established: 1864,
    isAuthorized: true
  },
  {
    name: "Leeds Building Society",
    sortCode: "40-51-62",
    bankCode: "LEED",
    type: "building-society",
    website: "https://www.leedsbuildingsociety.co.uk",
    established: 1846,
    isAuthorized: true
  },
  {
    name: "Skipton Building Society",
    sortCode: "40-02-26",
    bankCode: "SKIP",
    type: "building-society",
    website: "https://www.skipton.co.uk",
    established: 1853,
    isAuthorized: true
  },
  {
    name: "Newcastle Building Society",
    sortCode: "56-00-36",
    bankCode: "NEWC",
    type: "building-society",
    website: "https://www.newcastle.co.uk",
    established: 1863,
    isAuthorized: true
  },
  {
    name: "Principality Building Society",
    sortCode: "40-05-20",
    bankCode: "PRIN",
    type: "building-society",
    website: "https://www.principality.co.uk",
    established: 1860,
    isAuthorized: true
  },
  {
    name: "West Bromwich Building Society",
    sortCode: "30-96-86",
    bankCode: "WEST",
    type: "building-society",
    website: "https://www.westbrom.co.uk",
    established: 1849,
    isAuthorized: true
  },

  // Investment Banks
  {
    name: "Goldman Sachs International",
    sortCode: "20-00-00",
    bankCode: "GSIL",
    type: "investment",
    website: "https://www.goldmansachs.com",
    established: 1869,
    isAuthorized: true
  },
  {
    name: "Morgan Stanley & Co. International PLC",
    sortCode: "20-00-00",
    bankCode: "MSIL",
    type: "investment",
    website: "https://www.morganstanley.com",
    established: 1935,
    isAuthorized: true
  },
  {
    name: "JPMorgan Chase Bank N.A.",
    sortCode: "20-00-00",
    bankCode: "JPMC",
    type: "investment",
    website: "https://www.jpmorganchase.com",
    established: 1799,
    isAuthorized: true
  },
  {
    name: "Deutsche Bank AG",
    sortCode: "20-00-00",
    bankCode: "DEUT",
    type: "investment",
    website: "https://www.db.com",
    established: 1870,
    isAuthorized: true
  },
  {
    name: "Credit Suisse (UK) Limited",
    sortCode: "20-00-00",
    bankCode: "CRSU",
    type: "investment",
    website: "https://www.credit-suisse.com",
    established: 1856,
    isAuthorized: true
  },
  {
    name: "UBS AG",
    sortCode: "20-00-00",
    bankCode: "UBSA",
    type: "investment",
    website: "https://www.ubs.com",
    established: 1862,
    isAuthorized: true
  },

  // International Banks
  {
    name: "Bank of America N.A.",
    sortCode: "20-00-00",
    bankCode: "BOFA",
    type: "international",
    website: "https://www.bankofamerica.com",
    established: 1784,
    isAuthorized: true
  },
  {
    name: "Citibank N.A.",
    sortCode: "20-00-00",
    bankCode: "CITI",
    type: "international",
    website: "https://www.citibank.co.uk",
    established: 1812,
    isAuthorized: true
  },
  {
    name: "Wells Fargo Bank N.A.",
    sortCode: "20-00-00",
    bankCode: "WELS",
    type: "international",
    website: "https://www.wellsfargo.com",
    established: 1852,
    isAuthorized: true
  },
  {
    name: "BNP Paribas",
    sortCode: "20-00-00",
    bankCode: "BNPP",
    type: "international",
    website: "https://www.bnpparibas.co.uk",
    established: 1848,
    isAuthorized: true
  },
  {
    name: "Société Générale",
    sortCode: "20-00-00",
    bankCode: "SOGE",
    type: "international",
    website: "https://www.societegenerale.co.uk",
    established: 1864,
    isAuthorized: true
  },
  {
    name: "Crédit Agricole Corporate and Investment Bank",
    sortCode: "20-00-00",
    bankCode: "CACB",
    type: "international",
    website: "https://www.ca-cib.com",
    established: 1894,
    isAuthorized: true
  },
  {
    name: "Mizuho Bank Ltd",
    sortCode: "20-00-00",
    bankCode: "MIZU",
    type: "international",
    website: "https://www.mizuhobank.com",
    established: 2002,
    isAuthorized: true
  },
  {
    name: "Sumitomo Mitsui Banking Corporation",
    sortCode: "20-00-00",
    bankCode: "SMBC",
    type: "international",
    website: "https://www.smbc.co.jp",
    established: 2001,
    isAuthorized: true
  },

  // Specialist Banks
  {
    name: "Close Brothers Limited",
    sortCode: "30-00-00",
    bankCode: "CLOS",
    type: "specialist",
    website: "https://www.closebrothers.com",
    established: 1878,
    isAuthorized: true
  },
  {
    name: "Shawbrook Bank Limited",
    sortCode: "20-00-00",
    bankCode: "SHAW",
    type: "specialist",
    website: "https://www.shawbrook.co.uk",
    established: 2011,
    isAuthorized: true
  },
  {
    name: "Aldermore Bank PLC",
    sortCode: "20-00-00",
    bankCode: "ALDE",
    type: "specialist",
    website: "https://www.aldermore.co.uk",
    established: 2009,
    isAuthorized: true
  },
  {
    name: "Secure Trust Bank PLC",
    sortCode: "20-00-00",
    bankCode: "SECU",
    type: "specialist",
    website: "https://www.securetrustbank.com",
    established: 1952,
    isAuthorized: true
  },
  {
    name: "Paragon Bank PLC",
    sortCode: "20-00-00",
    bankCode: "PARA",
    type: "specialist",
    website: "https://www.paragonbank.co.uk",
    established: 1985,
    isAuthorized: true
  },
  {
    name: "Oaknorth Bank Limited",
    sortCode: "20-00-00",
    bankCode: "OAKN",
    type: "specialist",
    website: "https://www.oaknorth.com",
    established: 2015,
    isAuthorized: true
  },
  {
    name: "Metro Bank PLC",
    sortCode: "23-05-80",
    bankCode: "METR",
    type: "specialist",
    website: "https://www.metrobankonline.co.uk",
    established: 2010,
    isAuthorized: true
  },
  {
    name: "Handelsbanken",
    sortCode: "20-00-00",
    bankCode: "HAND",
    type: "specialist",
    website: "https://www.handelsbanken.co.uk",
    established: 1871,
    isAuthorized: true
  },

  // Digital-Only Banks
  {
    name: "First Direct",
    sortCode: "40-47-31",
    bankCode: "FIRS",
    type: "challenger",
    website: "https://www.firstdirect.com",
    established: 1989,
    isAuthorized: true
  },
  {
    name: "Smile",
    sortCode: "20-00-00",
    bankCode: "SMILE",
    type: "challenger",
    website: "https://www.smile.co.uk",
    established: 1999,
    isAuthorized: true
  },
  {
    name: "Cahoot",
    sortCode: "20-00-00",
    bankCode: "CAHO",
    type: "challenger",
    website: "https://www.cahoot.com",
    established: 2000,
    isAuthorized: true
  },
  {
    name: "M&S Bank",
    sortCode: "20-00-00",
    bankCode: "MARS",
    type: "challenger",
    website: "https://bank.marksandspencer.com",
    established: 2012,
    isAuthorized: true
  },
  {
    name: "Tesco Bank",
    sortCode: "20-00-00",
    bankCode: "TESC",
    type: "challenger",
    website: "https://www.tescobank.com",
    established: 1997,
    isAuthorized: true
  },
  {
    name: "Sainsbury's Bank",
    sortCode: "20-00-00",
    bankCode: "SAIN",
    type: "challenger",
    website: "https://www.sainsburysbank.co.uk",
    established: 1997,
    isAuthorized: true
  }
];
