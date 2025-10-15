export interface UKBank {
  name: string;
  sortCode: string;
}

export const ukBanks: UKBank[] = [
  { name: 'Barclays Bank', sortCode: '20-00-00' },
  { name: 'HSBC UK', sortCode: '40-00-00' },
  { name: 'Lloyds Bank', sortCode: '30-00-00' },
  { name: 'NatWest', sortCode: '60-00-00' },
  { name: 'Royal Bank of Scotland', sortCode: '83-00-00' },
  { name: 'Santander UK', sortCode: '09-01-28' },
  { name: 'Halifax', sortCode: '11-00-00' },
  { name: 'Bank of Scotland', sortCode: '80-00-00' },
  { name: 'TSB Bank', sortCode: '77-00-00' },
  { name: 'Nationwide Building Society', sortCode: '07-00-00' },
  { name: 'Metro Bank', sortCode: '23-05-80' },
  { name: 'Monzo', sortCode: '04-00-04' },
  { name: 'Starling Bank', sortCode: '60-83-71' },
  { name: 'Revolut', sortCode: '04-00-75' },
  { name: 'Virgin Money', sortCode: '05-00-00' },
  { name: 'Clydesdale Bank', sortCode: '82-00-00' },
  { name: 'Yorkshire Bank', sortCode: '05-05-00' },
  { name: 'Co-operative Bank', sortCode: '08-92-99' },
];
