function getLocaleForCurrency(currency: string): string {
  const currencyLocaleMap: { [key: string]: string } = {
    USD: "en-US",
    EUR: "de-DE",
    JPY: "ja-JP",
    NGN: "en-NG",
  };

  return currencyLocaleMap[currency] || "en-US";
}
export function formatCurrency(amount: any, currency = "USD") {
  const locale = getLocaleForCurrency(currency);
  try {
    const formattedAmount = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
    return formattedAmount;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return amount;
  }
}

export const getDaysLeft = (endDate: any) => {
  const end = new Date(endDate);
  const now = new Date();
  const timeDifference = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  return daysLeft;
};

export const getHigherPlans = (amount: any, data: any) => {
  return data.filter((plan: any) => parseFloat(plan.amount) > amount);
};
export function getGreeting() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning! 👋";
  } else if (currentHour >= 12 && currentHour < 18) {
    return "Good Afternoon! 👋";
  } else {
    return "Good Evening! 👋";
  }
}

export function getLetterUrls(data: any) {
  return data.flatMap((item: any) =>
    item.letters.map(
      (letter: any) => letter?.finalNotarizedLetterUrl ?? letter?.letterUrl
    )
  );
}

export function daysLeft(targetDate: string, daysCount: number): number {
  const targetDateTime = new Date(targetDate).getTime();
  const currentDateTime = new Date().getTime();
  const targetPlusCount = targetDateTime + daysCount * 24 * 60 * 60 * 1000;

  const diffInMs = targetPlusCount - currentDateTime;
  const diffInDays = Math.ceil(diffInMs / (24 * 60 * 60 * 1000));

  return diffInDays;
}

export const sortByPrice = (data: any) => {
  let payload = [...data];
  return payload.sort(
    (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount)
  );
};

export const resolveCurrency = (currency: string) => {
  const currencyMap: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    JPY: "¥",
    NGN: "₦",
  };
  return currencyMap[currency] || currency;
}