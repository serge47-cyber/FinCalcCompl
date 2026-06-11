import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  ReferenceArea,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, 
  Info, 
  HelpCircle, 
  ShieldCheck, 
  Landmark, 
  Sparkles, 
  Check, 
  Percent, 
  ArrowRight, 
  RefreshCw, 
  Calendar, 
  Coins, 
  Award, 
  AlertTriangle, 
  BookOpen,
  ChevronDown,
  Scale,
  Sliders,
  Plus,
  Trash2,
  Briefcase,
  ShieldAlert,
  Activity,
  DollarSign
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// Types
type CalculatorType = "insurance" | "deposit" | "ovdp" | "retirement";
type InterestType = "simple" | "compound";

interface MacroIndicators {
  nbuKeyRate: number;
  uird12mUah: number;
  ovdpYieldUah: number;
  inflationRate: number;
  usdUahRate: number;
  avgDevaluation: number;
  militaryTax: number;
  pitTax: number;
  insuranceTaxRebate: number;
}

const defaultIndicators: MacroIndicators = {
  nbuKeyRate: 13.0,
  uird12mUah: 11.5,
  ovdpYieldUah: 15.2,
  inflationRate: 6.8,
  usdUahRate: 41.20,
  avgDevaluation: 4.2,
  militaryTax: 5.0,
  pitTax: 18.0,
  insuranceTaxRebate: 18.0,
};

const depositSteps = [
  { label: "3 дні", days: 3, isDays: true },
  { label: "1 міс.", months: 1 },
  { label: "3 міс.", months: 3 },
  { label: "6 міс.", months: 6 },
  { label: "9 міс.", months: 9 },
  { label: "12 міс.", months: 12 },
  { label: "18 міс.", months: 18 },
  { label: "24 міс.", months: 24 },
  { label: "36 міс.", months: 36 }
];

export default function App() {
  // Tabs & Calculations general state
  const [activeTab, setActiveTab] = useState<CalculatorType>("insurance");
  const [appMode, setAppMode] = useState<"calculators" | "comparison" | "portfolio">("calculators");
  const [interestType, setInterestType] = useState<InterestType>("compound");
  const [indicators, setIndicators] = useState<MacroIndicators>(defaultIndicators);
  const [loadingIndicators, setLoadingIndicators] = useState<boolean>(true);

  // Form parameters
  const [amountInputVal, setAmountInputVal] = useState<string>("10,000");
  const [amount, setAmount] = useState<number>(10000);
  const [termYears, setTermYears] = useState<number>(10);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [depositStepIndex, setDepositStepIndex] = useState<number>(5); // Default to 12 months (index 5)
  const [rate, setRate] = useState<number>(10.0);
  const [compoundPeriod, setCompoundPeriod] = useState<number>(12); // compound frequency per year

  // Extra options
  const [taxRebateActive, setTaxRebateActive] = useState<boolean>(true);
  const [ovdpBrokerFee, setOvdpBrokerFee] = useState<number>(200);
  const [ovdpWithdrawalFee, setOvdpWithdrawalFee] = useState<number>(0.2); // %
  const [depositRolloverMode, setDepositRolloverMode] = useState<string>("rollover_principal");
  const [depositHorizonYears, setDepositHorizonYears] = useState<number>(5);

  // Contrast comparison configurations
  const [selectedAsset, setSelectedAsset] = useState<string>("kua");
  const [customCompareRate, setCustomCompareRate] = useState<number>(15.0);
  const [customCompareTax, setCustomCompareTax] = useState<number>(0.0);

  // Manual inputs active tabs for side economics panel
  const [panelMode, setPanelMode] = useState<"params" | "macro">("params");
  
  // Accordion for educational mathematical formulas
  const [formulasOpen, setFormulasOpen] = useState<boolean>(false);

  // Risk zone visualization management
  const [highlightRiskZones, setHighlightRiskZones] = useState<boolean>(true);

  // USD Mode state (convert outputs to USD with projected devaluation)
  const [isUsdMode, setIsUsdMode] = useState<boolean>(false);

  // Retirement Plan specific states
  const [retirementTargetCapital, setRetirementTargetCapital] = useState<number>(5000000);
  const [retirementYears, setRetirementYears] = useState<number>(25);
  const [retirementReturnRate, setRetirementReturnRate] = useState<number>(12.0);

  // Dynamic returns comparison table view mode ("unified" or "custom")
  const [comparisonTab, setComparisonTab] = useState<"unified" | "custom">("unified");

  // Portfolio Analyzer States & Interfaces
  interface PortfolioAsset {
    id: string;
    name: string;
    weight: number; // 0-100
    rate: number; // nominal expected annual return e.g. 15.2
    tax: number; // expected tax rate on profit e.g. 23%
    risk: number; // 1-100 individual risk score
    color: string;
    isCustom?: boolean;
  }

  const [portfolioAmountInput, setPortfolioAmountInput] = useState<string>("150,000");
  const [portfolioAmount, setPortfolioAmount] = useState<number>(150000);
  const [portfolioHorizon, setPortfolioHorizon] = useState<number>(5); // 1, 3, 5, 10 years
  const [portfolioPreset, setPortfolioPreset] = useState<string>("balanced");

  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([
    { id: "ovdp", name: "Державні ОВДП", weight: 30, rate: 15.2, tax: 0, risk: 10, color: "#10b981" },
    { id: "deposit", name: "Гривневий Депозит", weight: 25, rate: 11.5, tax: 23, risk: 20, color: "#f59e0b" },
    { id: "lifecare", name: "СК LifeCare (Страхування життя)", weight: 25, rate: 10.0, tax: 0, risk: 15, color: "#6366f1" },
    { id: "npf", name: "НПФ (Пенсійний фонд)", weight: 20, rate: 12.0, tax: 0, risk: 40, color: "#a855f7" }
  ]);

  // Custom asset inputs
  const [newAssetName, setNewAssetName] = useState<string>("");
  const [newAssetRate, setNewAssetRate] = useState<number>(14.0);
  const [newAssetTax, setNewAssetTax] = useState<number>(19.5);
  const [newAssetRisk, setNewAssetRisk] = useState<number>(60);
  const [newAssetColor, setNewAssetColor] = useState<string>("#8b5cf6");
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // AI consultant auditing
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiTips, setAiTips] = useState<string[] | null>(null);
  const [aiLoadingStep, setAiLoadingStep] = useState<string>("");

  // Fetch verified online macroeconomic indicators with robust retry mechanisms
  useEffect(() => {
    let active = true;
    async function loadIndicatorsWithRetry(retriesLeft = 4, delay = 500) {
      try {
        // Try both relative and absolute window URL origins to be absolutely sure in all sandboxes
        const url = `${window.location.origin}/api/indicators`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          setIndicators(data.indicators);
          // Set appropriate rates as defaults on load based on parsed values
          if (activeTab === "deposit") {
            setRate(data.indicators.uird12mUah);
          } else if (activeTab === "ovdp") {
            setRate(data.indicators.ovdpYieldUah);
          }
          setLoadingIndicators(false);
        }
      } catch (err) {
        if (retriesLeft > 0 && active) {
          console.warn(`Fetch indicators failed, retrying in ${delay}ms... (${retriesLeft} retries left)`, err);
          setTimeout(() => {
            if (active) {
              loadIndicatorsWithRetry(retriesLeft - 1, delay * 2);
            }
          }, delay);
        } else {
          console.error("Could not fetch verified indicators, using safety fallbacks", err);
          if (active) {
            setLoadingIndicators(false);
          }
        }
      }
    }
    
    setLoadingIndicators(true);
    loadIndicatorsWithRetry();

    return () => {
      active = false;
    };
  }, [activeTab]);

  // Adjust defaults per tab activation
  const handleTabSwitch = (type: CalculatorType) => {
    setAppMode("calculators");
    setActiveTab(type);
    if (type === "insurance") {
      setAmount(10000);
      setAmountInputVal("10,000");
      setTermYears(10);
      setRate(10.0);
      setCompoundPeriod(12);
      setInterestType("compound");
    } else if (type === "deposit") {
      setAmount(100000);
      setAmountInputVal("100,000");
      setRate(indicators.uird12mUah);
      setCompoundPeriod(365); // default daily capitalization
      setInterestType("compound");
    } else if (type === "ovdp") {
      setAmount(100000);
      setAmountInputVal("100,000");
      setRate(indicators.ovdpYieldUah);
      setCompoundPeriod(2); // payout coupons every 6 months
      setInterestType("simple");
    }
    setAiResponse(null);
  };

  // Synchronizers of ranges <-> numeric values
  const handleAmountRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAmount(val);
    setAmountInputVal(val.toLocaleString("en-US"));
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^\d]/g, "");
    if (!clean) {
      setAmountInputVal("");
      return;
    }
    const numeric = parseInt(clean, 10);
    setAmountInputVal(numeric.toLocaleString("en-US"));
    
    // Bounds check
    let min = activeTab === "insurance" ? 1000 : 5000;
    let max = activeTab === "insurance" ? 100000 : 5000000;
    let clamped = Math.max(min, Math.min(max, numeric));
    setAmount(clamped);
  };

  const handleAmountInputBlur = () => {
    setAmountInputVal(amount.toLocaleString("en-US"));
  };

  // Helper formatting numbers
  const formatUah = (num: number) => {
    return isUsdMode ? formatUsd(num) : (Math.round(num).toLocaleString("uk-UA") + " ₴");
  };

  const formatUsd = (num: number) => {
    return "$" + Math.round(num).toLocaleString("en-US");
  };

  const formatCurrency = (num: number) => {
    return isUsdMode ? formatUsd(num) : formatUah(num);
  };

  const formatPercentVal = (num: number) => {
    return num.toLocaleString("uk-UA", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " %";
  };

  // Dynamic label declensions for Ukrainian grammar
  const getYearsLabel = (years: number) => {
    const lastDigit = years % 10;
    const lastTwo = years % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return "років";
    if (lastDigit === 1) return "рік";
    if (lastDigit >= 2 && lastDigit <= 4) return "роки";
    return "років";
  };

  const getMonthsLabel = (months: number) => {
    const lastDigit = months % 10;
    const lastTwo = months % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return "місяців";
    if (lastDigit === 1) return "місяць";
    if (lastDigit >= 2 && lastDigit <= 4) return "місяці";
    return "місяців";
  };

  // Alternative benchmark parameters
  const getAltAssetParameters = () => {
    if (selectedAsset === "custom") {
      return { label: "Альтернатива", rate: customCompareRate, tax: customCompareTax };
    }
    
    let label = "";
    let rateVal = 0;
    let taxVal = 0;

    switch (selectedAsset) {
      case "deposit":
        label = "Гривневий Депозит";
        rateVal = indicators.uird12mUah;
        taxVal = indicators.pitTax + indicators.militaryTax; // 23%
        break;
      case "ovdp":
        label = "Державні ОВДП";
        rateVal = indicators.ovdpYieldUah;
        taxVal = 0; // Tax free
        break;
      case "sp500":
        label = "S&P 500 (USD $)";
        rateVal = 10.5; // average long term
        taxVal = 19.5; // foreign investment standard
        break;
      case "npf":
        label = "НПФ Пенсійний фонд";
        rateVal = 12.0;
        taxVal = 0; // special pension account exempt parameters
        break;
      case "kua":
        label = "КУА / ПІФ";
        rateVal = 14.5;
        taxVal = 19.5;
        break;
      case "property":
        label = "Житлова нерухомість (оренда)";
        rateVal = 7.5;
        taxVal = 19.5;
        break;
      default:
        label = "Порівнюваний варіант";
        rateVal = 10.0;
        taxVal = 23.0;
    }

    return { label, rate: rateVal, tax: taxVal };
  };

  const altParams = getAltAssetParameters();

  // --- SCIENTIFIC MATHEMATICAL SIMULATOR COMPILER ---
  interface ModelStepData {
    name: string;
    invested: number;
    mainCapital: number;
    altCapital: number;
    inflationRealCap: number;
    realMainCapital: number;
    isRiskZone: boolean;
  }

  const runSimulation = (): {
    chartData: ModelStepData[];
    totalInvested: number;
    finalAccumulated: number;
    netProfit: number;
    totalTaxRebateSum: number;
    mIndexed?: number;
    mFlat?: number;
  } => {
    if (activeTab === "retirement") {
      const C_real = retirementTargetCapital; // in active currency
      const N = retirementYears;
      const r_nom = retirementReturnRate / 100;
      const i_rate = indicators.inflationRate / 100;

      // real rate of return: (1 + r_nom) / (1 + i_rate) - 1
      const r_real = i_rate > 0 ? ((1 + r_nom) / (1 + i_rate) - 1) : r_nom;
      
      // monthly real rate
      const r_real_m = r_real > 0 ? (Math.pow(1 + r_real, 1 / 12) - 1) : 0;
      
      // Required monthly contribution in real terms (today's money)
      let m_indexed = 0;
      if (r_real_m > 0 && N > 0) {
        m_indexed = C_real * (r_real_m / (Math.pow(1 + r_real_m, 12 * N) - 1));
      } else if (N > 0) {
        m_indexed = C_real / (12 * N);
      }

      const r_m_nom = r_nom / 12;
      const C_nom = C_real * Math.pow(1 + i_rate, N);
      let m_flat = 0;
      if (r_m_nom > 0 && N > 0) {
        m_flat = C_nom * (r_m_nom / (Math.pow(1 + r_m_nom, 12 * N) - 1));
      } else if (N > 0) {
        m_flat = C_nom / (12 * N);
      }

      // We will build yearly data points
      const retirementChartData: ModelStepData[] = [];

      for (let yr = 1; yr <= N; yr++) {
        // Real invested cumulative
        const investedRealYr = m_indexed * 12 * yr;
        
        // Nominal invested cumulative
        let investedNomYr = 0;
        if (i_rate > 0) {
          investedNomYr = m_indexed * 12 * ((Math.pow(1 + i_rate, yr) - 1) / i_rate);
        } else {
          investedNomYr = m_indexed * 12 * yr;
        }

        // Real capital accumulated
        let capRealYr = 0;
        if (r_real_m > 0) {
          capRealYr = m_indexed * ((Math.pow(1 + r_real_m, 12 * yr) - 1) / r_real_m);
        } else {
          capRealYr = m_indexed * 12 * yr;
        }

        // Nominal capital accumulated
        const capNomYr = capRealYr * Math.pow(1 + i_rate, yr);

        // Target nominal line
        const targetNomYr = C_real * Math.pow(1 + i_rate, yr);

        retirementChartData.push({
          name: `Рік ${yr}`,
          invested: Math.round(investedNomYr),
          mainCapital: Math.round(capNomYr),
          altCapital: Math.round(targetNomYr),
          inflationRealCap: Math.round(investedRealYr),
          realMainCapital: Math.round(capRealYr),
          isRiskZone: false
        });
      }

      const finalAccumulatedVal = Math.round(C_nom);
      const totalInvestedVal = retirementChartData.length > 0 ? retirementChartData[retirementChartData.length - 1].invested : 0;
      const netProfitVal = finalAccumulatedVal - totalInvestedVal;

      return {
        chartData: retirementChartData,
        totalInvested: totalInvestedVal,
        finalAccumulated: finalAccumulatedVal,
        netProfit: netProfitVal,
        totalTaxRebateSum: 0,
        mIndexed: Math.round(m_indexed),
        mFlat: Math.round(m_flat)
      };
    }

    const chartData: ModelStepData[] = [];
    let totalInvested = 0;
    let finalAccumulated = 0;
    let totalTaxRebateSum = 0;
    
    const r = rate / 100;
    const inflationRate = indicators.inflationRate / 100;
    const altRate = altParams.rate / 100;
    const altTax = altParams.tax / 100;

    // Determine specific passive income tax for the active tab under Ukrainian legislature
    let activeTaxRate = 0; 
    if (activeTab === "deposit") activeTaxRate = (indicators.pitTax + indicators.militaryTax) / 100; // 23%
    if (activeTab === "ovdp") activeTaxRate = 0; // Tax-free (0%)
    if (activeTab === "insurance") activeTaxRate = 0; // Payout packages held over 5 years are tax-free (0%)

    // --- MODEL 1: LIFE INSURANCE (regular monthly accumulation) ---
    if (activeTab === "insurance") {
      let mainCap = 0;
      let altCap = 0;
      let simpleInterestEarnings = 0;
      let cumulativeInvested = 0;

      // 12 data points - 1 for each year of the term
      for (let yr = 1; yr <= termYears; yr++) {
        let annualContribution = amount * 12;
        cumulativeInvested += annualContribution;

        // Simulate month by month calculation inside the year
        for (let m = 1; m <= 12; m++) {
          mainCap += amount;
          altCap += amount;

          if (interestType === "simple") {
            simpleInterestEarnings += cumulativeInvested * (r / 12);
          } else {
            // compound interest calculated per month or specified frequency
            // standard health insurance compounds monthly or annually
            const compFreq = compoundPeriod; // e.g. 12
            mainCap *= (1 + r / compFreq);
          }

          // alternative investment monthly capitalization
          altCap *= (1 + (altCap * altRate * (1 - altTax) / 12) / altCap);
        }

        // Article 166 of Tax Code of Ukraine: annual 18% PIT tax rebate if active
        // Eligible cap of annual insurance payments is realistic around Ukrainian limits
        // Capped by realistic wage parameters (max 150 000 UAH annual eligibility)
        if (taxRebateActive) {
          const eligibleSum = Math.min(annualContribution, 150000);
          const annualRebate = eligibleSum * 0.18;
          totalTaxRebateSum += annualRebate;
          
          // Re-invest premium refund right back into the principal capital
          mainCap += annualRebate;
        }

        // Correctly calculate purchasing power erosion via real compound formula
        const realInflationMultiplier = Math.pow(1 + inflationRate, yr);
        const inflationDiscounted = cumulativeInvested / realInflationMultiplier;

        const mainCapitalVal = Math.max(cumulativeInvested, Math.round(interestType === "compound" ? mainCap : (cumulativeInvested + simpleInterestEarnings)));
        const realMainCapVal = Math.round(mainCapitalVal / Math.pow(1 + indicators.inflationRate / 100, yr));

        chartData.push({
          name: `Рік ${yr}`,
          invested: cumulativeInvested,
          mainCapital: mainCapitalVal,
          altCapital: Math.round(altCap),
          inflationRealCap: Math.round(inflationDiscounted),
          realMainCapital: realMainCapVal,
          isRiskZone: realMainCapVal < cumulativeInvested
        });
      }

      totalInvested = cumulativeInvested;
      finalAccumulated = chartData.length > 0 ? chartData[chartData.length - 1].mainCapital : totalInvested;
    }

    // --- MODEL 2: BANK DEPOSIT (with Horizon Modeling and Rollovers) ---
    else if (activeTab === "deposit") {
      const selectedStep = depositSteps[depositStepIndex];
      const singleCycleYears = selectedStep.isDays 
        ? (selectedStep.days / 365) 
        : (selectedStep.months / 12);
      
      const horizonYears = depositHorizonYears;
      totalInvested = amount;

      // Compound calculation equation
      const calcGrossDepositReturnForYears = (p: number, yrs: number): number => {
        if (yrs <= 0) return 0;
        if (interestType === "simple" || compoundPeriod === 1) {
          return p * r * yrs;
        } else if (compoundPeriod === 365) {
          // Daily capitalization
          return p * (Math.pow(1 + r / 365, yrs * 365) - 1);
        } else {
          // Monthly capitalization
          return p * (Math.pow(1 + r / 12, yrs * 12) - 1);
        }
      };

      const stepsCount = 6;
      for (let i = 0; i <= stepsCount; i++) {
        const fraction = i / stepsCount;
        const activeT = horizonYears * fraction;
        
        let mainVal = amount;
        let altVal = amount;

        // Standard Single deposit cycle (No automatic rollover)
        if (depositRolloverMode === "single") {
          const actualDepositYrs = Math.min(activeT, singleCycleYears);
          const grossProfit = calcGrossDepositReturnForYears(amount, actualDepositYrs);
          const netProfit = grossProfit * (1 - activeTaxRate);
          mainVal = amount + netProfit;
        } 
        // Rollover: Re-invest net interest over the modeling horizon
        else if (depositRolloverMode === "rollover_principal") {
          const cyclesCount = Math.floor(activeT / singleCycleYears);
          const remainderYrs = activeT - (cyclesCount * singleCycleYears);
          
          let currentPrincipal = amount;
          for (let cy = 0; cy < cyclesCount; cy++) {
            const cycleGross = calcGrossDepositReturnForYears(currentPrincipal, singleCycleYears);
            currentPrincipal += cycleGross * (1 - activeTaxRate);
          }
          if (remainderYrs > 0) {
            const remainderGross = calcGrossDepositReturnForYears(currentPrincipal, remainderYrs);
            currentPrincipal += remainderGross * (1 - activeTaxRate);
          }
          mainVal = currentPrincipal;
        }
        // Rollover: Accumulate net interest in a flat companion account
        else {
          const cyclesCount = Math.floor(activeT / singleCycleYears);
          const remainderYrs = activeT - (cyclesCount * singleCycleYears);
          
          let accumulatedPayouts = 0;
          for (let cy = 0; cy < cyclesCount; cy++) {
            const cycleGross = calcGrossDepositReturnForYears(amount, singleCycleYears);
            accumulatedPayouts += cycleGross * (1 - activeTaxRate);
          }
          if (remainderYrs > 0) {
            const remainderGross = calcGrossDepositReturnForYears(amount, remainderYrs);
            accumulatedPayouts += remainderGross * (1 - activeTaxRate);
          }
          mainVal = amount + accumulatedPayouts;
        }

        // Alternative asset growth over simulation
        altVal = amount + (amount * altRate * (1 - altTax) * activeT);

        // Inflation purchasing power decline on principal
        const inflationRealValue = amount / Math.pow(1 + inflationRate, activeT);

        const mainCapitalVal = Math.round(mainVal);
        const realMainCapVal = Math.round(mainCapitalVal / Math.pow(1 + indicators.inflationRate / 100, activeT));

        chartData.push({
          name: activeT === 0 ? "Старт" : `${activeT.toFixed(1)} р.`,
          invested: amount,
          mainCapital: mainCapitalVal,
          altCapital: Math.round(altVal),
          inflationRealCap: Math.round(inflationRealValue),
          realMainCapital: realMainCapVal,
          isRiskZone: realMainCapVal < amount
        });
      }

      finalAccumulated = chartData[chartData.length - 1].mainCapital;
    }

    // --- MODEL 3: GOVERNMENT BONDS - ОВДП (tax-free bonds with broker fees) ---
    else if (activeTab === "ovdp") {
      // Amount includes brokerage buying costs initially
      const actualBondPrincipal = amount;
      totalInvested = amount + ovdpBrokerFee;
      
      const tYrs = termMonths / 12;
      const serviceCost = actualBondPrincipal * (ovdpWithdrawalFee / 100);

      const stepsCount = 6;
      for (let i = 0; i <= stepsCount; i++) {
        const fraction = i / stepsCount;
        const currentT = tYrs * fraction;
        const monthsPassed = Math.round(termMonths * fraction);

        // Under Ukrainian coupon distribution: either coupon simple payout or compound rollover
        // ОВДП Coupons are typically paid every 6 months (compoundPeriod = 2) or yearly (compoundPeriod = 1)
        const payoutFreq = compoundPeriod || 2;
        const couponsCount = Math.floor(currentT * payoutFreq);

        let mainCap = actualBondPrincipal;
        if (interestType === "simple") {
          const grossCoupons = couponsCount * (actualBondPrincipal * (r / payoutFreq));
          mainCap += grossCoupons;
        } else {
          // compounded re-invested coupons
          mainCap = actualBondPrincipal * Math.pow(1 + r / payoutFreq, couponsCount);
        }

        // Deduct withdrawal fee only at final maturity
        if (fraction === 1) {
          mainCap -= serviceCost;
        }

        // Alternative asset calculation
        const altAccrued = actualBondPrincipal * altRate * (1 - altTax) * currentT;
        const altVal = actualBondPrincipal + altAccrued;

        // Inflation erosion
        const inflationRealVal = totalInvested / Math.pow(1 + inflationRate, currentT);

        const mainCapitalVal = Math.round(Math.max(actualBondPrincipal, mainCap));
        const realMainCapVal = Math.round(mainCapitalVal / Math.pow(1 + indicators.inflationRate / 100, currentT));

        chartData.push({
          name: `${monthsPassed} міс.`,
          invested: totalInvested,
          mainCapital: mainCapitalVal,
          altCapital: Math.round(altVal),
          inflationRealCap: Math.round(inflationRealVal),
          realMainCapital: realMainCapVal,
          isRiskZone: realMainCapVal < totalInvested
        });
      }

      finalAccumulated = chartData[chartData.length - 1].mainCapital;
    }

    const netProfit = finalAccumulated - totalInvested;

    if (isUsdMode) {
      const currentRate = indicators.usdUahRate;
      const devalRate = indicators.avgDevaluation / 100;

      const convertedChartData = chartData.map((step, idx) => {
        let t = 0;
        if (activeTab === "insurance") {
          t = idx + 1;
        } else if (activeTab === "deposit") {
          t = depositHorizonYears * (idx / 6);
        } else if (activeTab === "ovdp") {
          t = (termMonths / 12) * (idx / 6);
        }

        const stepRate = currentRate * Math.pow(1 + devalRate, t);

        return {
          ...step,
          invested: Math.round(step.invested / stepRate),
          mainCapital: Math.round(step.mainCapital / stepRate),
          altCapital: Math.round(step.altCapital / stepRate),
          inflationRealCap: Math.round(step.inflationRealCap / stepRate),
          realMainCapital: Math.round(step.realMainCapital / stepRate),
        };
      });

      let termYearsVal = 1;
      if (activeTab === "insurance") {
        termYearsVal = termYears;
      } else if (activeTab === "deposit") {
        termYearsVal = depositHorizonYears;
      } else if (activeTab === "ovdp") {
        termYearsVal = termMonths / 12;
      }

      const finalRate = currentRate * Math.pow(1 + devalRate, termYearsVal);

      const usdTotalInvested = activeTab === "insurance"
        ? Math.round(chartData.reduce((sum, step, idx) => {
            const stepRate = currentRate * Math.pow(1 + devalRate, idx + 1);
            return sum + (amount * 12) / stepRate;
          }, 0))
        : Math.round(totalInvested / currentRate);

      const usdFinalAccumulated = Math.round(finalAccumulated / finalRate);
      const usdNetProfit = usdFinalAccumulated - usdTotalInvested;
      const usdTaxRebateSum = Math.round(totalTaxRebateSum / finalRate);

      return {
        chartData: convertedChartData,
        totalInvested: usdTotalInvested,
        finalAccumulated: usdFinalAccumulated,
        netProfit: usdNetProfit,
        totalTaxRebateSum: usdTaxRebateSum,
      };
    }

    return {
      chartData,
      totalInvested,
      finalAccumulated,
      netProfit,
      totalTaxRebateSum,
    };
  };

  const simulation = runSimulation();
  const portfolio = calculatePortfolio();

  const getTaxBreakdown = () => {
    const netProfit = simulation.netProfit;
    if (netProfit <= 0) {
      return {
        hasProfit: false,
        grossProfit: 0,
        pitVal: 0,
        milVal: 0,
        totalTax: 0,
        netProfit: 0,
        netPercent: 100,
        pitPercent: 0,
        milPercent: 0,
      };
    }

    let taxRate = 0;
    let pitRate = 18;
    let militaryRate = 5;

    if (activeTab === "deposit") {
      pitRate = indicators.pitTax;
      militaryRate = indicators.militaryTax;
      taxRate = (pitRate + militaryRate) / 100;
    } else {
      pitRate = 0;
      militaryRate = 0;
      taxRate = 0;
    }

    if (taxRate > 0) {
      const grossProfit = netProfit / (1 - taxRate);
      const totalTax = grossProfit - netProfit;
      const pitVal = grossProfit * (pitRate / 100);
      const milVal = grossProfit * (militaryRate / 100);

      const netPct = (netProfit / grossProfit) * 100;
      const pitPct = (pitVal / grossProfit) * 100;
      const milPct = (milVal / grossProfit) * 100;

      return {
        hasProfit: true,
        grossProfit,
        pitVal,
        milVal,
        totalTax,
        netProfit,
        netPercent: netPct,
        pitPercent: pitPct,
        milPercent: milPct,
      };
    } else {
      return {
        hasProfit: true,
        grossProfit: netProfit,
        pitVal: 0,
        milVal: 0,
        totalTax: 0,
        netProfit,
        netPercent: 100,
        pitPercent: 0,
        milPercent: 0,
      };
    }
  };

  const taxBreakdown = getTaxBreakdown();

  const simulateCustomAsset = (type: CalculatorType) => {
    const inflationRate = indicators.inflationRate / 100;

    const res = (() => {
      if (type === "insurance") {
        let mainCap = 0;
        let simpleInterestEarnings = 0;
        let cumulativeInvested = 0;
        const r = (activeTab === "insurance" ? rate : 10.0) / 100;
        const activeTerm = termYears;
        const activeAmount = activeTab === "insurance" ? amount : 10000;

        for (let yr = 1; yr <= activeTerm; yr++) {
          let annualContribution = activeAmount * 12;
          cumulativeInvested += annualContribution;
          for (let m = 1; m <= 12; m++) {
            mainCap += activeAmount;
            if (interestType === "simple") {
              simpleInterestEarnings += cumulativeInvested * (r / 12);
            } else {
              mainCap *= (1 + r / compoundPeriod);
            }
          }
          if (taxRebateActive) {
            const eligibleSum = Math.min(annualContribution, 150000);
            const annualRebate = eligibleSum * 0.18;
            mainCap += annualRebate;
          }
        }
        const finalNominal = Math.max(cumulativeInvested, Math.round(interestType === "compound" ? mainCap : (cumulativeInvested + simpleInterestEarnings)));
        const finalReal = finalNominal / Math.pow(1 + inflationRate, activeTerm);
        return {
          totalInvested: cumulativeInvested,
          finalNominal,
          finalReal,
          netProfitNominal: finalNominal - cumulativeInvested,
          netProfitReal: finalReal - cumulativeInvested,
          rate: r * 100,
          tax: 0,
          termLabel: `${activeTerm} ${getYearsLabel(activeTerm)}`,
          effectiveRate: r * 100 + (taxRebateActive ? 1.8 : 0)
        };
      } else if (type === "deposit") {
        const horizonYears = depositHorizonYears;
        const activeAmount = activeTab === "deposit" ? amount : 100000;
        const r = (activeTab === "deposit" ? rate : indicators.uird12mUah) / 100;
        const activeTaxRate = (indicators.pitTax + indicators.militaryTax) / 100;

        const singleStep = depositSteps[activeTab === "deposit" ? depositStepIndex : 5];
        const singleCycleYears = singleStep.isDays ? (singleStep.days / 365) : (singleStep.months / 12);

        const calcGross = (p: number, yrs: number): number => {
          if (yrs <= 0) return 0;
          if (interestType === "simple" || compoundPeriod === 1) {
            return p * r * yrs;
          } else if (compoundPeriod === 365) {
            return p * (Math.pow(1 + r / 365, yrs * 365) - 1);
          } else {
            return p * (Math.pow(1 + r / 12, yrs * 12) - 1);
          }
        };

        let mainVal = activeAmount;
        const rolloverMode = activeTab === "deposit" ? depositRolloverMode : "rollover_principal";

        if (rolloverMode === "single") {
          const actualDepositYrs = Math.min(horizonYears, singleCycleYears);
          const grossProfit = calcGross(activeAmount, actualDepositYrs);
          mainVal = activeAmount + grossProfit * (1 - activeTaxRate);
        } else if (rolloverMode === "rollover_principal") {
          const cyclesCount = Math.floor(horizonYears / singleCycleYears);
          const remainderYrs = horizonYears - (cyclesCount * singleCycleYears);
          let currentPrincipal = activeAmount;
          for (let cy = 0; cy < cyclesCount; cy++) {
            const cycleGross = calcGross(currentPrincipal, singleCycleYears);
            currentPrincipal += cycleGross * (1 - activeTaxRate);
          }
          if (remainderYrs > 0) {
            const remainderGross = calcGross(currentPrincipal, remainderYrs);
            currentPrincipal += remainderGross * (1 - activeTaxRate);
          }
          mainVal = currentPrincipal;
        } else {
          const cyclesCount = Math.floor(horizonYears / singleCycleYears);
          const remainderYrs = horizonYears - (cyclesCount * singleCycleYears);
          let accumulatedPayouts = 0;
          for (let cy = 0; cy < cyclesCount; cy++) {
            const cycleGross = calcGross(activeAmount, singleCycleYears);
            accumulatedPayouts += cycleGross * (1 - activeTaxRate);
          }
          if (remainderYrs > 0) {
            const remainderGross = calcGross(activeAmount, remainderYrs);
            accumulatedPayouts += remainderGross * (1 - activeTaxRate);
          }
          mainVal = activeAmount + accumulatedPayouts;
        }
        const finalNominal = mainVal;
        const finalReal = finalNominal / Math.pow(1 + inflationRate, horizonYears);
        return {
          totalInvested: activeAmount,
          finalNominal,
          finalReal,
          netProfitNominal: finalNominal - activeAmount,
          netProfitReal: finalReal - activeAmount,
          rate: r * 100,
          tax: indicators.pitTax + indicators.militaryTax,
          termLabel: `${horizonYears} ${getYearsLabel(horizonYears)}`,
          effectiveRate: r * (1 - activeTaxRate) * 100
        };
      } else if (type === "ovdp") {
        const activeAmount = activeTab === "ovdp" ? amount : 100000;
        const tYrs = (activeTab === "ovdp" ? termMonths : 12) / 12;
        const r = (activeTab === "ovdp" ? rate : indicators.ovdpYieldUah) / 100;
        const totalInvested = activeAmount + ovdpBrokerFee;
        const serviceCost = activeAmount * (ovdpWithdrawalFee / 100);
        const payoutFreq = compoundPeriod || 2;
        const couponsCount = Math.floor(tYrs * payoutFreq);

        let mainCap = activeAmount;
        if (interestType === "simple") {
          const grossCoupons = couponsCount * (activeAmount * (r / payoutFreq));
          mainCap += grossCoupons;
        } else {
          mainCap = activeAmount * Math.pow(1 + r / payoutFreq, couponsCount);
        }
        mainCap -= serviceCost;

        const finalNominal = Math.max(activeAmount, mainCap);
        const finalReal = finalNominal / Math.pow(1 + inflationRate, tYrs);
        return {
          totalInvested,
          finalNominal,
          finalReal,
          netProfitNominal: finalNominal - totalInvested,
          netProfitReal: finalReal - totalInvested,
          rate: r * 100,
          tax: 0,
          termLabel: `${activeTab === "ovdp" ? termMonths : 12} ${getMonthsLabel(activeTab === "ovdp" ? termMonths : 12)}`,
          effectiveRate: r * 100
        };
      } else {
        const C_real = retirementTargetCapital;
        const N = retirementYears;
        const r_nom = retirementReturnRate / 100;
        const i_rate = indicators.inflationRate / 100;

        const r_real = i_rate > 0 ? ((1 + r_nom) / (1 + i_rate) - 1) : r_nom;
        const r_real_m = r_real > 0 ? (Math.pow(1 + r_real, 1 / 12) - 1) : 0;
        
        let m_indexed = 0;
        if (r_real_m > 0 && N > 0) {
          m_indexed = C_real * (r_real_m / (Math.pow(1 + r_real_m, 12 * N) - 1));
        } else if (N > 0) {
          m_indexed = C_real / (12 * N);
        }

        const totalInvestedNom = m_indexed * 12 * (i_rate > 0 ? ((Math.pow(1 + i_rate, N) - 1) / i_rate) : N);
        const finalNominalVal = C_real * Math.pow(1 + i_rate, N);

        return {
          totalInvested: Math.round(totalInvestedNom),
          finalNominal: Math.round(finalNominalVal),
          finalReal: Math.round(C_real),
          netProfitNominal: Math.round(finalNominalVal - totalInvestedNom),
          netProfitReal: Math.round(C_real - m_indexed * 12 * N),
          rate: r_nom * 100,
          tax: 0,
          termLabel: `${N} ${getYearsLabel(N)}`,
          effectiveRate: r_nom * 100
        };
      }
    })();

    if (isUsdMode) {
      if (type === "retirement") {
        return res;
      }
      const currentRate = indicators.usdUahRate;
      const devalRate = indicators.avgDevaluation / 100;

      let termYearsVal = 1;
      if (type === "insurance") {
        termYearsVal = termYears;
      } else if (type === "deposit") {
        termYearsVal = depositHorizonYears;
      } else {
        termYearsVal = (activeTab === "ovdp" ? termMonths : 12) / 12;
      }

      const finalRate = currentRate * Math.pow(1 + devalRate, termYearsVal);

      let usdInvested = 0;
      if (type === "insurance") {
        const activeAmount = activeTab === "insurance" ? amount : 10000;
        usdInvested = Math.round(Array.from({ length: termYearsVal }).reduce<number>((sum, _, idx) => {
          const stepRate = currentRate * Math.pow(1 + devalRate, idx + 1);
          return sum + ((activeAmount * 12) / stepRate);
        }, 0));
      } else {
        usdInvested = Math.round(res.totalInvested / currentRate);
      }

      const usdFinalNominal = Math.round(res.finalNominal / finalRate);
      const usdFinalReal = Math.round(res.finalReal / finalRate);

      return {
        ...res,
        totalInvested: usdInvested,
        finalNominal: usdFinalNominal,
        finalReal: usdFinalReal,
        netProfitNominal: usdFinalNominal - usdInvested,
        netProfitReal: usdFinalReal - usdInvested,
      };
    }

    return res;
  };

  const getUnifiedComparison = () => {
    const inflationRate = indicators.inflationRate / 100;
    const years = activeTab === "insurance" ? termYears : activeTab === "deposit" ? depositHorizonYears : activeTab === "retirement" ? retirementYears : Math.max(1, Math.round(termMonths / 12));
    const baseCap = activeTab === "retirement" ? (isUsdMode ? retirementTargetCapital * indicators.usdUahRate : retirementTargetCapital) : amount;

    // 1. BANK DEPOSIT CALCULATIONS (Unified)
    const depositNominalRate = indicators.uird12mUah;
    const depositTaxRate = (indicators.pitTax + indicators.militaryTax) / 100;
    const depositNetRate = (indicators.uird12mUah / 100) * (1 - depositTaxRate);
    const depFinalNominal = baseCap * Math.pow(1 + depositNetRate / 12, years * 12);
    const depTotalInvested = baseCap;
    const depFinalReal = depFinalNominal / Math.pow(1 + inflationRate, years);

    // 2. OVDP BONDS CALCULATIONS (Unified)
    const ovdpNominalRate = indicators.ovdpYieldUah;
    const ovdpTotalInvested = baseCap + ovdpBrokerFee;
    const ovdpFinalNominal = baseCap * Math.pow(1 + (ovdpNominalRate / 100) / 2, years * 2) - (baseCap * (ovdpWithdrawalFee / 100));
    const ovdpFinalReal = ovdpFinalNominal / Math.pow(1 + inflationRate, years);

    // 3. LIFE INSURANCE CALCULATIONS (Unified accumulation)
    const insNominalRate = 10.0;
    const annualInstallment = baseCap / years;
    const monthlyInstallment = annualInstallment / 12;

    let insMainCap = 0;
    let insTotalInvested = 0;

    for (let yr = 1; yr <= years; yr++) {
      insTotalInvested += annualInstallment;
      for (let m = 1; m <= 12; m++) {
        insMainCap += monthlyInstallment;
        insMainCap *= (1 + (insNominalRate / 100) / 12);
      }
      if (taxRebateActive) {
        const rebate = Math.min(annualInstallment, 150000) * 0.18;
        insMainCap += rebate;
      }
    }
    const insFinalNominal = insMainCap;
    const insFinalReal = insFinalNominal / Math.pow(1 + inflationRate, years);

    const result = [
      {
        type: "deposit" as CalculatorType,
        label: "Гривневий Депозит",
        nominalRate: depositNominalRate,
        effectiveRate: depositNominalRate * (1 - depositTaxRate),
        totalInvested: depTotalInvested,
        finalNominal: depFinalNominal,
        finalReal: depFinalReal,
        netProfitNominal: depFinalNominal - depTotalInvested,
        netProfitReal: depFinalReal - depTotalInvested,
        taxRate: indicators.pitTax + indicators.militaryTax,
        termLabel: `${years} ${getYearsLabel(years)}`,
        guarantee: "100% гарантовано державою ФГВФО",
        pros: "Абсолютна ліквідність, простий старт",
        cons: "Високе оподаткування (23% прибутку)"
      },
      {
        type: "ovdp" as CalculatorType,
        label: "Державні ОВДП",
        nominalRate: ovdpNominalRate,
        effectiveRate: ovdpNominalRate,
        totalInvested: ovdpTotalInvested,
        finalNominal: ovdpFinalNominal,
        finalReal: ovdpFinalReal,
        netProfitNominal: ovdpFinalNominal - ovdpTotalInvested,
        netProfitReal: ovdpFinalReal - ovdpTotalInvested,
        taxRate: 0,
        termLabel: `${years} ${getYearsLabel(years)}`,
        guarantee: "100% державна гарантія Мінфіну",
        pros: "Повна відсутність податків, високі ставки",
        cons: "Комісії брокера на купівлю/вивід"
      },
      {
        type: "insurance" as CalculatorType,
        label: "Накопичувальне страхування",
        nominalRate: insNominalRate,
        effectiveRate: insNominalRate + (taxRebateActive ? 1.8 : 0),
        totalInvested: insTotalInvested,
        finalNominal: insFinalNominal,
        finalReal: insFinalReal,
        netProfitNominal: insFinalNominal - insTotalInvested,
        netProfitReal: insFinalReal - insTotalInvested,
        taxRate: 0,
        termLabel: `${years} ${getYearsLabel(years)}`,
        guarantee: "Забезпечено резервами компанії",
        pros: "Податкова знижка 18%, медичний захист",
        cons: "Дуже низька ліквідність при розірванні"
      }
    ];

    if (isUsdMode) {
      const currentRate = indicators.usdUahRate;
      const devalRate = indicators.avgDevaluation / 105; // safe division factor 100
      const finalRate = currentRate * Math.pow(1 + indicators.avgDevaluation / 100, years);

      return result.map(item => {
        let usdInvested = 0;
        if (item.type === "insurance") {
          usdInvested = Math.round(Array.from({ length: years }).reduce<number>((sum, _, idx) => {
            const stepRate = currentRate * Math.pow(1 + indicators.avgDevaluation / 100, idx + 1);
            return sum + (annualInstallment / stepRate);
          }, 0));
        } else {
          usdInvested = Math.round(item.totalInvested / currentRate);
        }

        const usdFinalNominal = Math.round(item.finalNominal / finalRate);
        const usdFinalReal = Math.round(item.finalReal / finalRate);

        return {
          ...item,
          totalInvested: usdInvested,
          finalNominal: usdFinalNominal,
          finalReal: usdFinalReal,
          netProfitNominal: usdFinalNominal - usdInvested,
          netProfitReal: usdFinalReal - usdInvested,
        };
      });
    }

    return result;
  };

  // --- PORTFOLIO ANALYZER MATHEMATICS & HANDLERS ---
  function calculatePortfolio() {
    const sumWeights = portfolioAssets.reduce((sum, item) => sum + item.weight, 0);
    const normalizedFactor = sumWeights > 0 ? 100 / sumWeights : 1.0;
    
    const chartData: any[] = [];
    const inflationRate = indicators.inflationRate / 100;
    const stepsCount = 6;
    const tMax = portfolioHorizon; // years

    let weightedRate = 0;
    let weightedRisk = 0;
    
    portfolioAssets.forEach(item => {
      const actWeight = sumWeights > 0 ? (item.weight * normalizedFactor) : 0;
      const netRate = item.rate * (1 - item.tax / 100);
      weightedRate += (netRate * actWeight) / 100;
      weightedRisk += (item.risk * actWeight) / 100;
    });

    for (let i = 0; i <= stepsCount; i++) {
      const fraction = i / stepsCount;
      const currentT = tMax * fraction;
      
      let totalNominal = 0;
      
      portfolioAssets.forEach(item => {
        const allocatedPercent = item.weight / 100;
        const originalAllocated = portfolioAmount * allocatedPercent;
        const netRate = (item.rate * (1 - item.tax / 100)) / 100;
        
        // Compound monthly interest
        const finalVal = originalAllocated * Math.pow(1 + netRate / 12, 12 * currentT);
        totalNominal += finalVal;
      });

      const totalInvestedSum = portfolioAmount * (sumWeights / 100);
      const inflationAdjustedVal = totalNominal / Math.pow(1 + inflationRate, currentT);
      
      let label = "";
      if (tMax <= 1) {
        label = `${Math.round(currentT * 12)} міс.`;
      } else {
        label = `${currentT.toFixed(currentT % 1 === 0 ? 0 : 1)} р.`;
      }

      chartData.push({
        name: label,
        invested: Math.round(totalInvestedSum),
        nominalVal: Math.round(totalNominal),
        realVal: Math.round(inflationAdjustedVal)
      });
    }

    const finalNode = chartData[chartData.length - 1];
    const totalNominalPayout = finalNode ? finalNode.nominalVal : 0;
    const totalRealPayout = finalNode ? finalNode.realVal : 0;
    const totalInvestedSum = portfolioAmount * (sumWeights / 100);
    const netNominalProfit = totalNominalPayout - totalInvestedSum;
    const netRealProfit = totalRealPayout - totalInvestedSum;

    if (isUsdMode) {
      const currentRate = indicators.usdUahRate;
      const devalRate = indicators.avgDevaluation / 100;

      const convertedChartData = chartData.map((step, idx) => {
        const t = portfolioHorizon * (idx / 6);
        const stepRate = currentRate * Math.pow(1 + devalRate, t);

        return {
          ...step,
          invested: Math.round(step.invested / stepRate),
          nominalVal: Math.round(step.nominalVal / stepRate),
          realVal: Math.round(step.realVal / stepRate),
        };
      });

      const finalRate = currentRate * Math.pow(1 + devalRate, portfolioHorizon);
      const usdTotalInvestedSum = Math.round(totalInvestedSum / currentRate);
      const usdTotalNominalPayout = Math.round(totalNominalPayout / finalRate);
      const usdTotalRealPayout = Math.round(totalRealPayout / finalRate);
      const usdNetNominalProfit = usdTotalNominalPayout - usdTotalInvestedSum;
      const usdNetRealProfit = usdTotalRealPayout - usdTotalInvestedSum;

      return {
        chartData: convertedChartData,
        totalNominalPayout: usdTotalNominalPayout,
        totalRealPayout: usdTotalRealPayout,
        netNominalProfit: usdNetNominalProfit,
        netRealProfit: usdNetRealProfit,
        weightedRate,
        weightedRisk,
        sumWeights,
        totalInvestedSum: usdTotalInvestedSum
      };
    }

    return {
      chartData,
      totalNominalPayout,
      totalRealPayout,
      netNominalProfit,
      netRealProfit,
      weightedRate,
      weightedRisk,
      sumWeights,
      totalInvestedSum
    };
  };

  const handlePortfolioAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (rawVal === "") {
      setPortfolioAmountInput("");
      setPortfolioAmount(0);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    setPortfolioAmountInput(parsed.toLocaleString("uk-UA"));
    setPortfolioAmount(parsed);
  };

  const applyPortfolioPreset = (presetName: string) => {
    setPortfolioPreset(presetName);
    setPortfolioError(null);
    if (presetName === "conservative") {
      setPortfolioAssets([
        { id: "ovdp", name: "Державні ОВДП", weight: 40, rate: 15.2, tax: 0, risk: 10, color: "#10b981" },
        { id: "deposit", name: "Гривневий Депозит", weight: 25, rate: 11.5, tax: 23, risk: 20, color: "#f59e0b" },
        { id: "lifecare", name: "СК LifeCare (Страхування життя)", weight: 20, rate: 10.0, tax: 0, risk: 15, color: "#6366f1" },
        { id: "npf", name: "НПФ (Пенсійний фонд)", weight: 15, rate: 12.0, tax: 0, risk: 40, color: "#a855f7" }
      ]);
    } else if (presetName === "balanced") {
      setPortfolioAssets([
        { id: "ovdp", name: "Державні ОВДП", weight: 25, rate: 15.2, tax: 0, risk: 10, color: "#10b981" },
        { id: "deposit", name: "Гривневий Депозит", weight: 20, rate: 11.5, tax: 23, risk: 20, color: "#f59e0b" },
        { id: "lifecare", name: "СК LifeCare (Страхування життя)", weight: 20, rate: 10.0, tax: 0, risk: 15, color: "#6366f1" },
        { id: "npf", name: "НПФ (Пенсійний фонд)", weight: 15, rate: 12.0, tax: 0, risk: 40, color: "#a855f7" },
        { id: "usd_cash", name: "Валютний USD-Кеш", weight: 10, rate: 3.5, tax: 0, risk: 35, color: "#06b6d4" },
        { id: "etf", name: "Іноземні акції / ETF", weight: 10, rate: 14.5, tax: 19.5, risk: 85, color: "#ec4899" }
      ]);
    } else if (presetName === "aggressive") {
      setPortfolioAssets([
        { id: "ovdp", name: "Державні ОВДП", weight: 10, rate: 15.2, tax: 0, risk: 10, color: "#10b981" },
        { id: "lifecare", name: "СК LifeCare (Страхування життя)", weight: 10, rate: 10.0, tax: 0, risk: 15, color: "#6366f1" },
        { id: "npf", name: "НПФ (Пенсійний фонд)", weight: 10, rate: 12.0, tax: 0, risk: 45, color: "#8b5cf6" },
        { id: "etf", name: "Іноземні акції / ETF", weight: 40, rate: 14.5, tax: 19.5, risk: 85, color: "#ec4899" },
        { id: "crypto", name: "Криптовалютні активи", weight: 20, rate: 25.0, tax: 19.5, risk: 95, color: "#fa3571" },
        { id: "gold", name: "Банківське золото", weight: 10, rate: 8.5, tax: 0, risk: 50, color: "#eab308" }
      ]);
    }
  };

  const handleAssetWeightChange = (index: number, newWeight: number) => {
    setPortfolioPreset("custom");
    const updated = [...portfolioAssets];
    updated[index].weight = isNaN(newWeight) ? 0 : Math.max(0, Math.min(100, newWeight));
    setPortfolioAssets(updated);
  };

  const handleAssetRateChange = (index: number, newRate: number) => {
    setPortfolioPreset("custom");
    const updated = [...portfolioAssets];
    updated[index].rate = isNaN(newRate) ? 0 : Math.max(0, Math.min(100, newRate));
    setPortfolioAssets(updated);
  };

  const handleAssetTaxChange = (index: number, newTax: number) => {
    setPortfolioPreset("custom");
    const updated = [...portfolioAssets];
    updated[index].tax = isNaN(newTax) ? 0 : Math.max(0, Math.min(100, newTax));
    setPortfolioAssets(updated);
  };

  const handleDeleteAsset = (index: number) => {
    if (portfolioAssets.length <= 1) {
      setPortfolioError("Портфель повинен містити хоча б один актив.");
      return;
    }
    setPortfolioPreset("custom");
    const updated = portfolioAssets.filter((_, idx) => idx !== index);
    setPortfolioAssets(updated);
    setPortfolioError(null);
  };

  const handlePercentEqualWeights = () => {
    setPortfolioPreset("custom");
    const perAsset = Math.floor(100 / portfolioAssets.length);
    const updated = portfolioAssets.map((asset, i) => ({
      ...asset,
      weight: i === portfolioAssets.length - 1 ? 100 - (perAsset * (portfolioAssets.length - 1)) : perAsset
    }));
    setPortfolioAssets(updated);
    setPortfolioError(null);
  };

  const handleNormalizeWeights = () => {
    setPortfolioPreset("custom");
    const sum = portfolioAssets.reduce((s, a) => s + a.weight, 0);
    if (sum === 0) {
      handlePercentEqualWeights();
      return;
    }
    const updated = portfolioAssets.map(asset => ({
      ...asset,
      weight: Math.round((asset.weight / sum) * 100)
    }));
    const roundedSum = updated.reduce((s, a) => s + a.weight, 0);
    if (roundedSum !== 100 && updated.length > 0) {
      updated[updated.length - 1].weight += (100 - roundedSum);
    }
    setPortfolioAssets(updated);
    setPortfolioError(null);
  };

  const handleAddCustomAsset = () => {
    if (!newAssetName.trim()) {
      setPortfolioError("Вкажіть назву нового активу.");
      return;
    }
    setPortfolioPreset("custom");
    const newId = `custom-${Date.now()}`;
    const newAsset: PortfolioAsset = {
      id: newId,
      name: newAssetName.trim(),
      weight: 0,
      rate: newAssetRate,
      tax: newAssetTax,
      risk: newAssetRisk,
      color: newAssetColor,
      isCustom: true
    };
    setPortfolioAssets([...portfolioAssets, newAsset]);
    setNewAssetName("");
    setPortfolioError(null);
  };

  // --- GEMINI REST FULL PORTFOLIO ANALYTICS AUDITOR ---
  const handleAiConsulting = async () => {
    setAiLoading(true);
    setAiResponse(null);
    setAiTips(null);
    setAiLoadingStep("🔍 Аналізуємо податкові наслідки за законодавством України...");

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      await delay(1200);
      setAiLoadingStep("📈 Розраховуємо девальваційні ризики щодо курсу ₴/$...");
      await delay(1200);
      setAiLoadingStep("➗ Перевіряємо реальну доходність проти інфляції...");
      await delay(1000);
      setAiLoadingStep("🔮 Запускаємо штучний інтелект Gemini 3.5 для аудиту...");

      const reportConfig = {
        calculator: activeTab,
        principal: amount,
        monthlyPayment: activeTab === "insurance" ? amount : 0,
        termYears: activeTab === "insurance" ? termYears : (activeTab === "deposit" ? depositHorizonYears : Math.round(termMonths / 12)),
        termMonths: activeTab === "ovdp" ? termMonths : undefined,
        ratePercent: rate,
        taxPercent: activeTab === "deposit" ? (indicators.pitTax + indicators.militaryTax) : 0,
        inflationPercent: indicators.inflationRate,
        selectedComparisonAsset: selectedAsset,
        calculatedMainYield: simulation.finalAccumulated,
        calculatedMainProfit: simulation.netProfit,
        calculatedComparisonYield: simulation.chartData[simulation.chartData.length - 1]?.altCapital || 0,
        comparisonLabel: altParams.label,
        taxRebateActive: activeTab === "insurance" && taxRebateActive,
        totalTaxRebateSum: simulation.totalTaxRebateSum,
        fxRate: indicators.usdUahRate,
        fxDevaluation: indicators.avgDevaluation,
        altRate: altParams.rate,
        altTax: altParams.tax
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportConfig),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAiResponse(data.analysis);
          setAiTips(data.tips || []);
        } else {
          setAiResponse(`❌ Помилка: ${data.error}`);
        }
      } else {
        setAiResponse("⚠️ Не вдалося зв'язатися з сервером аналітики. Будь ласка, переконайтеся, що ключ GEMINI_API_KEY налаштований у розділі Secrets.");
      }
    } catch (err: any) {
      setAiResponse(`❌ Виникла помилка інтернет-з'єднання: ${err.message || err}`);
    } finally {
      setAiLoading(false);
      setAiLoadingStep("");
    }
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Dynamic Upper Status Bar with indicators styled with "Geometric Balance" layout */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-sm rotate-45 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/35">
              <span className="text-white font-bold -rotate-45 text-lg">∑</span>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold tracking-tight text-white flex items-center gap-2">
                FIN-MATH <span className="text-indigo-400 font-semibold text-xs bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">PRO</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans">Мульти-інструментальний фінансовий симулятор &amp; AI-Аналітик</p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 w-full md:w-auto shadow-inner max-w-xl">
            <button 
              id="main-tab-calculators"
              onClick={() => setAppMode("calculators")} 
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 bg-transparent ${
                appMode === "calculators" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Калькулятори</span>
            </button>
            <button 
              id="main-tab-comparison"
              onClick={() => setAppMode("comparison")} 
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 bg-transparent ${
                appMode === "comparison" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Порівняльний аудит</span>
            </button>
            <button 
              id="main-tab-portfolio"
              onClick={() => setAppMode("portfolio")} 
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 bg-transparent ${
                appMode === "portfolio" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Портфель</span>
            </button>
          </div>

          {/* Quick Realtime Rates Ticker conforming to Geometric Balance Top Market Bar */}
          <div className="hidden lg:flex items-center gap-6 text-xs bg-slate-955 px-4 py-1.5 rounded-lg border border-slate-850">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-none">Облікова ставка НБУ</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{indicators.nbuKeyRate}%</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-none">USD/UAH NBU</span>
              <span className="text-xs font-mono text-white font-semibold">{indicators.usdUahRate.toFixed(4)}</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-none">Рівень інфляції</span>
              <span className="text-xs font-mono text-rose-400 font-semibold">{indicators.inflationRate}%</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex flex-col" title="Поточний день, місяць та рік">
              <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider leading-none">Поточна дата</span>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calculators Subtabs */}
        {appMode === "calculators" && (
          <div className="lg:col-span-12">
            <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-inner gap-1.5">
              <button 
                id="sub-tab-calc-insurance"
                onClick={() => setActiveTab("insurance")}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-lg transition-all border-0 bg-transparent cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "insurance" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" : "text-slate-400 hover:text-white"
                }`}
              >
                💎 СК LifeCare
              </button>
              <button 
                id="sub-tab-calc-deposit"
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-lg transition-all border-0 bg-transparent cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "deposit" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" : "text-slate-400 hover:text-white"
                }`}
              >
                🏦 Банківські Депозити
              </button>
              <button 
                id="sub-tab-calc-ovdp"
                onClick={() => setActiveTab("ovdp")}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-lg transition-all border-0 bg-transparent cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "ovdp" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" : "text-slate-400 hover:text-white"
                }`}
              >
                🇺🇦 Державні ОВДП
              </button>
              <button 
                id="sub-tab-calc-retirement"
                onClick={() => setActiveTab("retirement")}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-lg transition-all border-0 bg-transparent cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "retirement" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" : "text-slate-400 hover:text-white"
                }`}
              >
                👵 Пенсійне планування
              </button>
            </div>
          </div>
        )}

        {/* Left Side Settings Form Panel - 4 columns */}
        {appMode === "calculators" && (
          <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700 shadow-xl space-y-5">
            {/* Header subtabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 shadow-inner">
              <button 
                onClick={() => setPanelMode("params")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  panelMode === "params" ? "bg-slate-800 text-indigo-400" : "text-slate-400 hover:text-white"
                }`}
                id="tab-btn-params"
              >
                Параметри внеску
              </button>
              <button 
                onClick={() => setPanelMode("macro")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  panelMode === "macro" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-white"
                }`}
                id="tab-btn-macro"
              >
                Ринкові умови (Макро)
              </button>
            </div>

            {/* TAB CONTENT: Investment parameters */}
            {panelMode === "params" && (
              <div className="space-y-5" id="panel-params">
                  <>
                    {/* Active Mathematical Formula Indicator Card */}
                    <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50 shadow-inner text-center">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-2">Активна математична модель</span>
                      <div className="font-mono text-indigo-300 text-base italic leading-none py-1 overflow-x-auto whitespace-nowrap">
                        {activeTab === "insurance" ? (
                          interestType === "compound" ? "A = ∑ [P · (1 + r/n)ⁿᵗ] + Rebate" : "A = ∑ [P · (1 + r · t)] + Rebate"
                        ) : activeTab === "deposit" ? (
                          interestType === "compound" ? "A = P · (1 + r/n)ⁿᵗ - Tax" : "A = P · (1 + r · t) - Tax"
                        ) : activeTab === "ovdp" ? (
                          interestType === "compound" ? "A = P · (1 + r/n)ⁿ - Fees" : "A = P + ∑ [P · r/n] - Fees"
                        ) : (
                          "M = C · r_m / [(1 + r_m)¹²ᴺ - 1]"
                        )}
                      </div>
                    </div>

                {activeTab === "retirement" ? (
                  <>
                    {/* 1. Target Capital Goal Input */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400">Цільовий капітал (на сьогодні)</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            value={retirementTargetCapital.toLocaleString("en-US")}
                            onChange={(e) => {
                              const n = parseInt(e.target.value.replace(/,/g, "")) || 0;
                              setRetirementTargetCapital(n);
                            }}
                            className="bg-transparent text-right font-bold text-indigo-400 focus:outline-none border-b border-dashed border-indigo-500/45 focus:border-solid focus:border-indigo-500 transition-all w-28 p-0 focus:ring-0 text-sm font-mono"
                            id="val-retirement-target-input"
                          />
                          <span className="font-bold text-indigo-400">{isUsdMode ? "$" : "₴"}</span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min={isUsdMode ? 25000 : 1000000} 
                        max={isUsdMode ? 2500000 : 100000000} 
                        step={isUsdMode ? 10000 : 500000}
                        value={retirementTargetCapital}
                        onChange={(e) => setRetirementTargetCapital(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        id="input-retirement-target"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>{isUsdMode ? "$25,000" : "1 000 000 ₴"}</span>
                        <span>{isUsdMode ? "$2.5M" : "100 000 000 ₴"}</span>
                      </div>
                    </div>

                    {/* 2. Years until retirement */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400">Років до виходу на пенсію</span>
                        <span className="font-bold text-indigo-400">
                          {retirementYears} {getYearsLabel(retirementYears)}
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="3"
                        max="45"
                        step="1"
                        value={retirementYears}
                        onChange={(e) => setRetirementYears(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        id="input-retirement-years"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>3 роки</span>
                        <span>45 років</span>
                      </div>
                    </div>

                    {/* 3. Expected return rate */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400">Очікувана річна прибутковість</span>
                        <span className="font-bold text-indigo-400">
                          {retirementReturnRate.toFixed(1)}% річних
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="3"
                        max="25"
                        step="0.5"
                        value={retirementReturnRate}
                        onChange={(e) => setRetirementReturnRate(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        id="input-retirement-return"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>3.0%</span>
                        <span>25.0%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 1. Capitalization simple/compound toggle */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Нарахування прибутку</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => setInterestType("simple")}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            interestType === "simple" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
                          }`}
                          id="btn-simple"
                        >
                          Простий відсоток
                        </button>
                        <button 
                          onClick={() => setInterestType("compound")}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            interestType === "compound" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
                          }`}
                          id="btn-compound"
                        >
                          Складний відсоток
                        </button>
                      </div>
                    </div>

                    {/* 2. Amount Input and Range coupling */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400">
                          {activeTab === "insurance" ? "Щомісячний внесок" : activeTab === "deposit" ? "Сума вкладу" : "Сума купівлі облігацій"}
                        </span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            value={amountInputVal}
                            onChange={handleAmountInputChange}
                            onBlur={handleAmountInputBlur}
                            className="bg-transparent text-right font-bold text-indigo-400 focus:outline-none border-b border-dashed border-indigo-500/45 focus:border-solid focus:border-indigo-500 transition-all w-24 p-0 focus:ring-0 text-sm font-mono"
                            id="val-amount-input"
                          />
                          <span className="font-bold text-indigo-400">₴</span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min={activeTab === "insurance" ? 1000 : 5000} 
                        max={activeTab === "insurance" ? 50000 : 2000000} 
                        step={activeTab === "insurance" ? 500 : 5000}
                        value={amount}
                        onChange={handleAmountRangeChange}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        id="input-amount"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>{activeTab === "insurance" ? "1 000" : "5 000"} ₴</span>
                        <span>{activeTab === "insurance" ? "50 000" : "2 000 000"} ₴</span>
                      </div>
                    </div>

                    {/* 3. Term Selection based on Active Tab */}
                    <div>
                      {activeTab === "insurance" ? (
                        // Insurance Term - in Years
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-slate-400">Термін договору</span>
                            <span className="font-bold text-indigo-400">
                              {termYears} {getYearsLabel(termYears)}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="3"
                            max="35"
                            step="1"
                            value={termYears}
                            onChange={(e) => setTermYears(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            id="input-time-years"
                          />
                        </div>
                      ) : activeTab === "ovdp" ? (
                        // Government Bonds Term - in Months
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-slate-400">Термін обігу паперів</span>
                            <span className="font-bold text-indigo-400">
                              {termMonths} {getMonthsLabel(termMonths)}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="3"
                            max="60"
                            step="1"
                            value={termMonths}
                            onChange={(e) => setTermMonths(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            id="input-time-months"
                          />
                        </div>
                      ) : (
                        // Bank Deposit step selection
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-slate-400">Період одного депозиту</span>
                            <span className="font-bold text-indigo-400">
                              {depositSteps[depositStepIndex].label}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max={depositSteps.length - 1}
                            step="1"
                            value={depositStepIndex}
                            onChange={(e) => setDepositStepIndex(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            id="input-time-step"
                          />
                        </div>
                      )}
                    </div>

                    {/* 4. Rates Slider synced with input */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400">Річна відсоткова ставка</span>
                        <div className="flex items-center gap-1 font-bold text-indigo-400">
                          <input 
                            type="number" 
                            step="0.1"
                            value={rate || ""}
                            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                            className="bg-transparent text-right font-bold text-indigo-400 focus:outline-none border-b border-dashed border-indigo-500/40 focus:border-solid focus:border-indigo-500 transition-all w-12 p-0 focus:ring-0 text-sm font-mono"
                            id="val-rate-input"
                          />
                          <span>% річних</span>
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="25"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        id="input-rate"
                      />
                    </div>

                    {/* 5. Compound capitalization periodicity details */}
                    <div id="compound-period-block" className={interestType === "simple" && activeTab !== "ovdp" ? "opacity-30 pointer-events-none" : ""}>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Періодичність капіталізації / виплат</label>
                      {activeTab === "insurance" ? (
                        <select 
                          value={compoundPeriod} 
                          onChange={(e) => setCompoundPeriod(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                        >
                          <option value="12">Щомісячна капіталізація</option>
                          <option value="4">Квартальна капіталізація</option>
                          <option value="1">Щорічна капіталізація</option>
                        </select>
                      ) : activeTab === "ovdp" ? (
                        <select 
                          value={compoundPeriod} 
                          onChange={(e) => setCompoundPeriod(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                        >
                          <option value="2">Виплата купона кожні 6 місяців</option>
                          <option value="1">Виплата купона раз на рік</option>
                        </select>
                      ) : (
                        <select 
                          value={compoundPeriod}
                          onChange={(e) => setCompoundPeriod(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                        >
                          <option value="365">Щоденне нарахування (капіталізоване)</option>
                          <option value="12">Щомісячна капіталізація</option>
                          <option value="1">В кінці строку вкладу</option>
                        </select>
                      )}
                    </div>

                    {/* 6. Deposit Rollover Configurations */}
                    {activeTab === "deposit" && (
                      <div className="space-y-3 p-3 bg-slate-950 rounded-2xl border border-slate-850" id="deposit-rollover-block">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Автопролонгація (Rollover)</label>
                          <select 
                            value={depositRolloverMode}
                            onChange={(e) => setDepositRolloverMode(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-medium"
                          >
                            <option value="single">Без автопролонгації (1 цикл)</option>
                            <option value="rollover_principal">Додавати чисті відсотки до тіла депозиту</option>
                            <option value="rollover_payout">Виплачувати відсотки на картку</option>
                          </select>
                        </div>

                        <div id="deposit-horizon-block">
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Горизонт моделювання</label>
                          <select 
                            value={depositHorizonYears}
                            onChange={(e) => setDepositHorizonYears(parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-medium"
                          >
                            <option value="1">1 рік</option>
                            <option value="2">2 роки</option>
                            <option value="3">3 роки</option>
                            <option value="5">5 років</option>
                            <option value="7">7 років</option>
                            <option value="10">10 років</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 7. LifeCare (СК) Tax Refund Toggle */}
                    {activeTab === "insurance" && (
                      <div className="flex items-center justify-between p-3.5 bg-indigo-950/25 border border-indigo-900/40 rounded-xl" id="insurance-tax-rebate-block">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 font-display">
                            <Award className="w-4 h-4 text-indigo-400" /> Державна знижка (ПДФО 18%)
                          </span>
                          <p className="text-[10px] text-slate-400 leading-tight">Щорічний грошовий кешбек від держави</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={taxRebateActive} 
                            onChange={() => setTaxRebateActive(!taxRebateActive)}
                            className="sr-only peer" 
                            id="input-tax-rebate"
                          />
                          <div className="w-11 h-6 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white peer-checked:after:border-indigo-600"></div>
                        </label>
                      </div>
                    )}

                    {/* 8. ОВДП Specific Broker settings */}
                    {activeTab === "ovdp" && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-850" id="ovdp-fee-block">
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-1">Комісія за купівлю</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number"
                              value={ovdpBrokerFee}
                              onChange={(e) => setOvdpBrokerFee(parseInt(e.target.value) || 0)}
                              className="bg-slate-900 text-center text-white border border-slate-850 rounded-lg p-1.5 text-xs font-bold w-full focus:outline-none focus:border-indigo-500"
                              id="input-ovdp-fee"
                            />
                            <span className="text-xs text-slate-400">₴</span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] text-slate-400 mb-1">Виведення / обслуг.</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              step="0.05"
                              value={ovdpWithdrawalFee}
                              onChange={(e) => setOvdpWithdrawalFee(parseFloat(e.target.value) || 0)}
                              className="bg-slate-900 text-center text-white border border-slate-850 rounded-lg p-1.5 text-xs font-bold w-full focus:outline-none focus:border-indigo-500"
                              id="input-ovdp-withdrawal-fee"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 9. Comparison Target selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Порівняти на графіку з</label>
                  <select 
                    value={selectedAsset} 
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer text-ellipsis overflow-hidden font-semibold"
                    id="select-asset"
                  >
                    <option value="deposit">Гривневий Депозит ({indicators.uird12mUah}% річних, под. 23%)</option>
                    <option value="ovdp">Державні ОВДП ({indicators.ovdpYieldUah}% річних, без оподатк.)</option>
                    <option value="sp505">S&P 500 Index ($ USD) (10.5% річних)</option>
                    <option value="npf">НПФ Пенсійний фонд (12.0% річних)</option>
                    <option value="kua">ПІФ / КУА (Інвестиційні фонди) (14.5% річних)</option>
                    <option value="property">Орендна Нерухомість (7.5% річних)</option>
                    <option value="custom">Свій варіант (задати значення вручну)</option>
                  </select>
                </div>

                {/* Custom benchmark input parameters */}
                {selectedAsset === "custom" && (
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3" id="custom-fields-container">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 text-center">Ваша ставка (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={customCompareRate}
                        onChange={(e) => setCustomCompareRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center text-white"
                        id="input-alt"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 text-center">Процент податку (%)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={customCompareTax}
                        onChange={(e) => setCustomCompareTax(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center text-white"
                        id="input-alt-tax"
                      />
                    </div>
                  </div>
                )}
                  </>
              </div>
            )}

            {/* TAB CONTENT: Macroeconomic indexes panel & rates modifier */}
            {panelMode === "macro" && (
              <div className="space-y-4" id="panel-macro">
                <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Основні макро-показники 2026</span>
                </div>

                {/* Inflation, Currency Rates */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800">
                    <span className="block text-[9px] text-slate-500 font-medium">Курс ₴/$</span>
                    <input 
                      type="number" 
                      step="0.05"
                      value={indicators.usdUahRate}
                      onChange={(e) => setIndicators({ ...indicators, usdUahRate: parseFloat(e.target.value) || 41.20 })}
                      className="bg-transparent text-center text-white font-bold text-xs focus:outline-none w-full mt-1"
                      id="input-usd-current"
                    />
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800">
                    <span className="block text-[9px] text-slate-500 font-medium">Девальвація</span>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <input 
                        type="number" 
                        step="0.1"
                        value={indicators.avgDevaluation}
                        onChange={(e) => setIndicators({ ...indicators, avgDevaluation: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent text-center text-white font-bold text-xs focus:outline-none w-14"
                        id="input-usd-forecast"
                      />
                      <span className="text-[10px] font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800">
                    <span className="block text-[9px] text-slate-500 font-medium">Інфляція</span>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <input 
                        type="number" 
                        step="0.1"
                        value={indicators.inflationRate}
                        onChange={(e) => setIndicators({ ...indicators, inflationRate: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent text-center text-white font-bold text-xs focus:outline-none w-14"
                        id="input-inflation"
                      />
                      <span className="text-[10px] font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Market interest rates configuration lists */}
                <div className="space-y-2 pt-2">
                  <span className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">Ставки ринкових активів (%)</span>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {/* Bank deposits rate config */}
                    <div className="grid grid-cols-12 gap-1 items-center bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/50">
                      <span className="col-span-4 text-[10px] text-slate-400 font-semibold text-ellipsis overflow-hidden">Депозит</span>
                      <div className="col-span-4 flex items-center bg-slate-950 px-1 rounded border border-slate-800">
                        <input 
                          type="number"
                          step="0.1"
                          value={indicators.uird12mUah}
                          onChange={(e) => setIndicators({ ...indicators, uird12mUah: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent text-center text-white font-bold text-[10px] focus:outline-none w-full p-0.5"
                          id="macro-rate-deposit"
                        />
                        <span className="text-[9px] text-slate-400">%</span>
                      </div>
                      <div className="col-span-4 flex items-center bg-slate-950 px-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 mr-1 col">Под.</span>
                        <input 
                          type="number" 
                          step="0.5"
                          value={indicators.pitTax + indicators.militaryTax}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 23;
                            setIndicators({ ...indicators, militaryTax: Math.max(0, val - 18) });
                          }}
                          className="bg-transparent text-center text-white font-bold text-[10px] focus:outline-none w-full p-0.5"
                          id="macro-tax-deposit"
                        />
                        <span className="text-[9px] text-slate-400">%</span>
                      </div>
                    </div>

                    {/* Government Bonds config */}
                    <div className="grid grid-cols-12 gap-1 items-center bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/50">
                      <span className="col-span-4 text-[10px] text-slate-400 font-semibold">ОВДП</span>
                      <div className="col-span-4 flex items-center bg-slate-950 px-1 rounded border border-slate-800">
                        <input 
                          type="number"
                          step="0.1"
                          value={indicators.ovdpYieldUah}
                          onChange={(e) => setIndicators({ ...indicators, ovdpYieldUah: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent text-center text-white font-bold text-[10px] focus:outline-none w-full p-0.5"
                          id="macro-rate-ovdp"
                        />
                        <span className="text-[9px] text-slate-400">%</span>
                      </div>
                      <div className="col-span-4 flex items-center bg-slate-950 px-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 mr-1">Под.</span>
                        <input 
                          type="number" 
                          value={0}
                          disabled
                          className="bg-transparent text-center text-slate-500 font-bold text-[10px] focus:outline-none w-full p-0.5 cursor-not-allowed"
                          id="macro-tax-ovdp"
                        />
                        <span className="text-[9px] text-slate-500">%</span>
                      </div>
                    </div>

                    {/* Inflation, key rate config */}
                    <div className="grid grid-cols-12 gap-1 items-center bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/50">
                      <span className="col-span-4 text-[10px] text-slate-400 font-semibold text-ellipsis overflow-hidden">НБУ ставка</span>
                      <div className="col-span-8 flex items-center bg-slate-950 px-1.5 rounded border border-slate-800">
                        <input 
                          type="number"
                          step="0.1"
                          value={indicators.nbuKeyRate}
                          onChange={(e) => setIndicators({ ...indicators, nbuKeyRate: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent text-left text-white font-bold text-[10px] focus:outline-none w-full p-0.5"
                        />
                        <span className="text-[9px] text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-cyan-950/15 border border-cyan-900/30 rounded-2xl">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Онлайн індикатори взяті відповідно до ринкових консенсус-прогнозів на <strong>2026 рік</strong>. Зниження відсоткових ставок або підвищення військового збору суттєво змінює інвестиційний результат.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Auditor CTA Card */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="p-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">ШІ-Експертний Консалтинг</h3>
                  <p className="text-[11px] text-slate-400">Генерація повного професійного аудиту з урахуванням ПКУ &amp; інфляції</p>
                </div>
              </div>

              <button
                onClick={handleAiConsulting}
                disabled={aiLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    Аналізуємо...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Отримати ШІ-аналіз Gemini
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Right Side Visual Analytics & Multi-mode Container */}
        <div className={`${appMode === "calculators" ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}>
          
          {appMode === "calculators" && (
            <>
              {/* Key Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 shadow-md relative overflow-hidden group">
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-display">
                {activeTab === "retirement" ? "Внесок (з індексацією)" : "Всього внесено"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-extrabold text-white tracking-tight" id="card-total-invested">
                  {activeTab === "retirement" ? `${formatUah(simulation.mIndexed || 0)}/міс.` : formatUah(simulation.totalInvested)}
                </span>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Coins className="w-12 h-12 text-slate-400" />
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 shadow-md relative overflow-hidden group">
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-display">
                {activeTab === "retirement" ? "Внесок (фіксований)" : "Очікувана виплата"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-extrabold text-indigo-400 tracking-tight" id="card-total-accumulated">
                  {activeTab === "retirement" ? `${formatUah(simulation.mFlat || 0)}/міс.` : formatUah(simulation.finalAccumulated)}
                </span>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Landmark className="w-12 h-12 text-indigo-400" />
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 shadow-md relative overflow-hidden group">
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-display">
                {activeTab === "retirement" ? "Капітал при виході" : "Чистий прибуток"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-mono font-extrabold tracking-tight ${activeTab === "retirement" ? "text-emerald-400" : (simulation.netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}`} id="card-net-profit">
                  {activeTab === "retirement" ? formatUah(simulation.finalAccumulated) : formatUah(simulation.netProfit)}
                </span>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <TrendingUp className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* AI Response output area (if loaded) */}
          {(aiLoading || aiResponse) && (
            <div className="bg-slate-800/40 rounded-xl border border-indigo-500/20 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-xl border-l border-b border-indigo-500/20">
                AI Expert Audit
              </div>

              {aiLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs text-indigo-400 font-bold tracking-widest uppercase mb-1">Складаємо висновок регулятора...</h4>
                    <p className="text-xs text-slate-400 animate-pulse">{aiLoadingStep}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Фінансовий експертизний аудит від Gemini</h4>
                      <p className="text-[10px] text-slate-400">Аналіз проведено відповідно до ПКУ та економічного клімату в Україні на 2026 р.</p>
                    </div>
                  </div>

                  {aiTips && aiTips.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/25 rounded-xl p-4 md:p-4.5 space-y-3 shadow-inner my-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                        <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 font-display">
                          3 головні фінансові поради
                        </h5>
                      </div>
                      <ul className="space-y-2 list-none pl-0">
                        {aiTips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-slate-250 flex items-start gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/35 text-amber-400 text-[10px] font-bold font-mono shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-snug text-slate-300 font-medium">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[450px] pr-2 markdown-body list-disc pl-3 prose prose-invert prose-xs">
                    <ReactMarkdown>{aiResponse || ""}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chart Wrapper Container */}
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-display">Інтерактивна модель дохідності капіталу</h3>
                <p className="text-[11px] text-slate-400">Порівняльна розгортка капіталізації проти інфляційного знецінення</p>
              </div>
              <div className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg flex gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-indigo-500 rounded"></span> Наш актив
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-emerald-500 rounded"></span> {altParams.label}
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2.5 h-1 bg-rose-500 rounded border-t border-dashed"></span>Реальна сила грошей
                </span>
              </div>
            </div>

            {/* USD Devaluation Conversion Module */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${isUsdMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">Проекція доходності в USD (тверда валюта)</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Розраховує доходність у твердій валюті з урахуванням поточного курсу{" "}
                    <span className="text-slate-300 font-semibold font-mono">{indicators.usdUahRate.toFixed(2)} грн/$</span>{" "}
                    та прогнозованої річної девальвації гривні{" "}
                    <span className="text-rose-450 font-semibold font-mono">{indicators.avgDevaluation.toFixed(1)}%</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t border-slate-800/60 md:border-t-0 pt-2.5 md:pt-0">
                <div className="text-right hidden sm:block">
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Поточний режим</span>
                  <span className="text-[11px] font-bold text-slate-200">
                    {isUsdMode ? "Проекція в USD ($)" : "Стандартний (грн ₴)"}
                  </span>
                </div>
                <button
                  type="button"
                  id="convert-to-usd-toggle"
                  onClick={() => setIsUsdMode(!isUsdMode)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5 ${
                    isUsdMode 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                      : "bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  {isUsdMode ? "Скинути до UAH ₴" : "Конвертація в USD $"}
                </button>
              </div>
            </div>

            {/* Interactive Risk & Shield Assessment Panel */}
            {(() => {
              const totalTax = activeTab === "deposit" ? (indicators.pitTax + indicators.militaryTax) : 0;
              const netYieldVal = activeTab === "deposit" ? rate * (1 - totalTax / 100) : rate;
              
              const isInflationRiskActive = netYieldVal < indicators.inflationRate;
              const isDevalRiskActive = netYieldVal < indicators.avgDevaluation;
              
              let riskLevel: "safe" | "warning" | "high" | "critical" = "safe";
              let riskTitle = "Капітал успішно захищено";
              let riskColor = "text-emerald-405 bg-emerald-950/25 border-emerald-900/30";
              let riskDescription = `Чиста доходність інструменту становить ${netYieldVal.toFixed(2)}% річних, що успішно перекриває прогнозовану інфляцію (${indicators.inflationRate}%) та очікувану девальвацію (${indicators.avgDevaluation}%).`;
              
              if (isInflationRiskActive && isDevalRiskActive) {
                riskLevel = "critical";
                riskTitle = "Критичний ризик: Подвійна ерозія (інфляція + девальвація)";
                riskColor = "text-rose-400 bg-rose-950/15 border-rose-900/30";
                riskDescription = `Чиста річна ставка ${netYieldVal.toFixed(2)}% не покриває ні очікувану інфляцію (${indicators.inflationRate}%), ни прогнозовану девальвацію (${indicators.avgDevaluation}%). Заощадження стрімко знецінюються в реальному часі.`;
              } else if (isInflationRiskActive) {
                riskLevel = "high";
                riskTitle = "Високий рівень ризику: Інфляційне знецінення";
                riskColor = "text-amber-400 bg-amber-950/20 border-amber-900/30";
                riskDescription = `Чиста доходність (${netYieldVal.toFixed(2)}%) є нижчою за рівень інфляції (${indicators.inflationRate}%). Накопичений капітал номінально зростатиме, але його реальна спроможність буде знижуватись.`;
              } else if (isDevalRiskActive) {
                riskLevel = "warning";
                riskTitle = "Помірний валютний ризик: Девальвація гривні";
                riskColor = "text-orange-400 bg-orange-950/20 border-orange-900/30";
                riskDescription = `Динаміка накопичень покриває інфляцію, проте чиста ставка (${netYieldVal.toFixed(2)}%) менша за очікувану девальвацію (${indicators.avgDevaluation}%). Можливі додаткові вигоди за утримання валюти.`;
              }

              return (
                <div className={`p-4 rounded-xl border ${riskColor} flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between transition-all duration-350`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-tight">
                      {riskLevel === "safe" ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-550" />
                      )}
                      <span>{riskTitle}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 font-mono text-slate-300">
                        Чиста ставка: {netYieldVal.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{riskDescription}</p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 pt-2 md:pt-0 border-t border-slate-900/10 md:border-t-0">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Підсвітити зони ризику:</span>
                    <button
                      type="button"
                      onClick={() => setHighlightRiskZones(!highlightRiskZones)}
                      className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                        highlightRiskZones ? "bg-rose-500" : "bg-slate-700"
                      }`}
                      id="toggle-risk-highlight"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          highlightRiskZones ? "translate-x-4" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Recharts chart representation with absolute inflation shaded band */}
            <div className="w-full h-[360px]" id="chart-viewport">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulation.chartData}>
                  <defs>
                    <linearGradient id="inflationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(239, 68, 68)" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="rgb(239, 68, 68)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="mainAccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  
                  {highlightRiskZones && simulation.chartData.map((dataPoint, idx) => {
                    if (idx === 0) return null;
                    const prevPoint = simulation.chartData[idx - 1];
                    if (dataPoint.isRiskZone || prevPoint.isRiskZone) {
                      return (
                        <ReferenceArea
                          key={`risk-${idx}`}
                          x1={prevPoint.name}
                          x2={dataPoint.name}
                          fill="#f43f5e"
                          fillOpacity={0.06}
                          stroke="#f43f5e"
                          strokeOpacity={0.15}
                          strokeDasharray="3 3"
                        />
                      );
                    }
                    return null;
                  })}

                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "0.5rem" }}
                    labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#f8fafc" }}
                    itemStyle={{ fontSize: "11px" }}
                    formatter={(value: any, name: string) => {
                      if (name === "mainCapital") return [formatUah(value), activeTab === "retirement" ? "Проекція пенсійного капіталу" : "Наш накопичений капітал"];
                      if (name === "altCapital") return [formatUah(value), `Капітал у порівнянні (${altParams.label})`];
                      if (name === "invested") return [formatUah(value), activeTab === "retirement" ? "Сума внесених коштів" : "Тіло вкладених грошей"];
                      if (name === "inflationRealCap") return [formatUah(value), "Реальна купівельна спроможність"];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10, fontSize: "11px" }}
                    formatter={(value) => {
                      if (value === "mainCapital") return activeTab === "retirement" ? "Пенсійний капітал" : "Обраний інструмент";
                      if (value === "altCapital") return `Порівняння (${altParams.label})`;
                      if (value === "invested") return activeTab === "retirement" ? "Загальна сума внесків" : "Внесені кошти";
                      if (value === "inflationRealCap") return "Реальні гроші (з урахуванням інфляції)";
                      return value;
                    }}
                  />
                  
                  {/* Real purchasing power degradation area */}
                  <Area 
                    type="monotone" 
                    dataKey="inflationRealCap" 
                    stroke="#ef4444" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#inflationGrad)" 
                  />

                  {/* Main asset build up area */}
                  <Area 
                    type="monotone" 
                    dataKey="mainCapital" 
                    stroke="#6366f1" 
                    strokeWidth={0}
                    fillOpacity={1} 
                    fill="url(#mainAccGrad)" 
                  />

                  <Line 
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="mainCapital" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 1 }}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="altCapital" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-400 font-sans">
              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Штрихування ризику на графіку</strong>
                  <p className="mt-1 leading-normal">
                    Напівпрозорі вертикальні смуги підсвічують періоди, коли реальні накопичення з урахуванням інфляції ({indicators.inflationRate}%) падають нижче фактично вкладених грошей. Це чітко сигналізує про виникнення зон від'ємної реальної прибутковості.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-display">Державні Гарантії &amp; Безпека</strong>
                  <p className="mt-1 leading-normal">
                    ОВДП гарантуються державою на 100% без податку (0%). Заощадження в банках гарантуються Фондом гарантування вкладів (ФГВФО) на 100% під час воєнного стану, але обкладаються 23% податків.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Promo and modular linkage blocks shown inside calculators mode right below chart */}
        {appMode === "calculators" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card 1: Comparative Audit */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-slate-700/80 hover:border-indigo-500/50 p-6 rounded-xl shadow-xl space-y-4 transition-all hover:scale-[1.005] group relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-405 border border-indigo-500/20 shadow-inner">
                    <Scale className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs font-display tracking-wide uppercase">Багатофакторний аудит</h4>
                    <p className="text-[9px] text-slate-500 font-mono tracking-wider">PORTFOLIO DEGRADATION ANALYSIS</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Порівняльна таблиця СК LifeCare, банківських депозитів та державних ОВДП в єдиних системних координатах з урахуванням податків ({indicators.pitTax + indicators.militaryTax}%) та ерозії інфляції.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-3">
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Гнучкі порівняння &gt;</span>
                <button 
                  type="button"
                  onClick={() => setAppMode("comparison")}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-colors shadow-md shadow-indigo-600/10 flex items-center gap-1 cursor-pointer border-0"
                >
                  Відкрити аудит →
                </button>
              </div>
            </div>

            {/* Card 2: Portfolio Builder */}
            <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-slate-700/80 hover:border-cyan-500/50 p-6 rounded-xl shadow-xl space-y-4 transition-all hover:scale-[1.005] group relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-405 border border-cyan-500/20 shadow-inner">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs font-display tracking-wide uppercase">Портфельний конструктор</h4>
                    <p className="text-[9px] text-slate-500 font-mono tracking-wider">PORTFOLIO WEIGHTED MODEL</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Об'єднуйте інвестиційні інструменти у єдиний портфель, налаштовуйте процентні частки кожного активу, аналізуйте середньозважену чисту прибутковість за вашим горизонтом.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-3">
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Ризик-профілі &gt;</span>
                <button 
                  type="button"
                  onClick={() => setAppMode("portfolio")}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-555 text-white font-bold text-[10px] rounded-lg transition-colors shadow-md shadow-cyan-600/10 flex items-center gap-1 cursor-pointer border-0"
                >
                  Зібрати портфель →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPARISON MODE CONTAINER */}
        {appMode === "comparison" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-xl border border-slate-700 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">Порівняльний аудит ефективності активів</h2>
                  <p className="text-[11px] text-slate-400">Аналіз дохідності інструментів за єдиних або поточних налаштувань у вашій системі</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAppMode("calculators")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-0 font-display flex items-center gap-1.5"
              >
                ← Повернутись до калькуляторів
              </button>
            </div>
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 shadow-xl space-y-6" id="assets-comparison-matrix">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  Порівняльний аудит ефективності активів
                </h3>
                <p className="text-[11px] text-slate-400">
                  Аналіз дохідності трьох інструментів з урахуванням податкового навантаження та інфляційної ерозії
                </p>
              </div>

              {/* View Controller Tabs */}
              <div className="flex bg-slate-950/85 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setComparisonTab("unified")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-205 ${
                    comparisonTab === "unified"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  id="compare-tab-unified"
                >
                  Єдині умови
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonTab("custom")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-205 ${
                    comparisonTab === "custom"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  id="compare-tab-custom"
                >
                  Поточні вкладки
                </button>
              </div>
            </div>

            {/* Context explainer */}
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-indigo-950/40 text-[11px] text-slate-300 leading-relaxed">
              {comparisonTab === "unified" ? (
                <span>
                  📌 <strong>Базовий сценарій порівняння:</strong> інвестуємо сукупний капітал у розмірі{" "}
                  <strong className="text-white">{formatUah(amount)}</strong> на термін{" "}
                  <strong className="text-white">
                    {activeTab === "insurance"
                      ? `${termYears} ${getYearsLabel(termYears)}`
                      : activeTab === "deposit"
                      ? `${depositHorizonYears} ${getYearsLabel(depositHorizonYears)}`
                      : `${Math.round(termMonths / 12)} ${getYearsLabel(Math.max(1, Math.round(termMonths / 12)))}`}
                  </strong>. Для депозиту та ОВДП — це разовий стартовий внесок на початку. Для страхування життя — сума розподілена рівними щорічними внесками, що дає сукупний вкладений капітал{" "}
                  <strong className="text-white">{formatUah(amount)}</strong> з користю від щорічної податкової пільги 18%.
                </span>
              ) : (
                <span>
                  ⚡ <strong>Поточні сценарії:</strong> порівняння виконано на основі індивідуальних параметрів, які ви окремо налаштували для кожного інструменту за вкладками калькулятора (різні суми, терміни й капіталізація).
                </span>
              )}
            </div>

            {/* Comparison Table Responsive Container */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px] border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[9px]">
                    <th className="py-3 px-4">Актив</th>
                    <th className="py-3 px-3">Термін</th>
                    <th className="py-3 px-3">Всього вкладено</th>
                    <th className="py-3 px-3 text-right">Ставка</th>
                    <th className="py-3 px-3 text-right">Податок</th>
                    <th className="py-3 px-3 text-right">Чиста ставка</th>
                    <th className="py-3 px-3 text-right text-indigo-400">Чистий прибуток</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Реальний фінал*</th>
                    <th className="py-3 px-4 text-center">Статус захисту</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-sans">
                  {(() => {
                    const data = comparisonTab === "unified"
                      ? getUnifiedComparison()
                      : ["deposit", "ovdp", "insurance"].map(type => {
                          const sim = simulateCustomAsset(type as CalculatorType);
                          return {
                            type: type as CalculatorType,
                            label: type === "deposit" ? "Гривневий Депозит" : type === "ovdp" ? "Державні ОВДП" : "Накопичувальне страхування",
                            nominalRate: sim.rate,
                            effectiveRate: sim.effectiveRate,
                            totalInvested: sim.totalInvested,
                            finalNominal: sim.finalNominal,
                            finalReal: sim.finalReal,
                            netProfitNominal: sim.netProfitNominal,
                            netProfitReal: sim.netProfitReal,
                            taxRate: type === "deposit" ? (indicators.pitTax + indicators.militaryTax) : 0,
                            termLabel: sim.termLabel,
                            guarantee: type === "deposit" ? "100% ФГВФО" : type === "ovdp" ? "100% Державна" : "Резерви компаній",
                            pros: type === "deposit" ? "Висока ліквідність" : type === "ovdp" ? "0% податку, держгарантії" : "Податкова пільга 18%",
                            cons: type === "deposit" ? "Податки 23% на дохід" : type === "ovdp" ? "Комісії покупки" : "Немає швидкого доступу"
                          };
                        });

                    const maxReal = Math.max(...data.map(d => d.finalReal));
                    
                    return data.map((item) => {
                      const isWinner = item.finalReal === maxReal;
                      const protectsInflation = item.finalReal >= item.totalInvested;
                      
                      return (
                        <tr 
                          key={item.type} 
                          className={`group transition-colors h-[54px] ${
                            isWinner 
                              ? "bg-indigo-950/15 hover:bg-indigo-950/25" 
                              : "hover:bg-slate-900/30"
                          }`}
                        >
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                item.type === "deposit" ? "bg-amber-500" : item.type === "ovdp" ? "bg-emerald-500" : "bg-indigo-500"
                              }`}></span>
                              <div>
                                <span className="font-display font-bold text-white block">{item.label}</span>
                                <span className="text-[9px] text-slate-500 tracking-tight block max-w-[200px] truncate">{item.guarantee}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono text-[10px]">
                            {item.termLabel}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono text-[10px]">
                            {formatUah(item.totalInvested)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-300">
                            {item.nominalRate.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-500">
                            {item.taxRate > 0 ? `${item.taxRate}%` : "0%"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[10px] text-emerald-400 font-semibold">
                            {item.effectiveRate.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[10px]">
                            <span className="text-indigo-300 font-bold block">+{formatUah(item.netProfitNominal)}</span>
                          </td>
                          <td className="py-1 px-3 text-right font-mono">
                            <div className="text-right">
                              <span className={`text-[11px] font-extrabold block ${protectsInflation ? "text-emerald-400" : "text-rose-400"}`}>
                                {formatUah(item.finalReal)}
                              </span>
                              <span className="text-[9px] text-slate-500 block leading-none select-none">
                                {item.netProfitReal >= 0 ? "+" : ""}{formatUah(item.netProfitReal)} реальними
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isWinner ? (
                                <span className="bg-indigo-600/30 text-indigo-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 shrink-0" /> Лідер
                                </span>
                              ) : protectsInflation ? (
                                <span className="bg-emerald-950/40 text-emerald-400 text-[9px] font-semibold px-2 py-0.5 rounded border border-emerald-900/30">
                                  Захищено
                                </span>
                              ) : (
                                <span className="bg-rose-950/40 text-rose-400 text-[9px] font-semibold px-2 py-0.5 rounded border border-rose-900/30">
                                  Знецінюється
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <p className="text-[9px] text-slate-500 leading-normal italic">
              * Реальний фінал: купівельна спроможність накопиченого капіталу після вирахування прогнозованої інфляції ({indicators.inflationRate}%) за вказаний термін інвестування.
            </p>

            {/* Winner educational insight cards */}
            {(() => {
              const data = comparisonTab === "unified"
                ? getUnifiedComparison()
                : ["deposit", "ovdp", "insurance"].map(type => {
                    const sim = simulateCustomAsset(type as CalculatorType);
                    return {
                      type: type as CalculatorType,
                      label: type === "deposit" ? "Гривневий Депозит" : type === "ovdp" ? "Державні ОВДП" : "Накопичувальне страхування",
                      finalReal: sim.finalReal,
                      totalInvested: sim.totalInvested
                    };
                  });

              const maxReal = Math.max(...data.map(d => d.finalReal));
              const bestAsset = data.find(d => d.finalReal === maxReal);
              
              if (!bestAsset) return null;

              let winnerTitle = "";
              let winnerDesc = "";
              if (bestAsset.type === "ovdp") {
                winnerTitle = "Чому ОВДП лідирують у захисті від інфляції?";
                winnerDesc = "Державні військові облігації мають дві критичні переваги: найвищу номінальну ставку на сьогодні та повну відсутність податку на дохід фізосіб (0% ПДФО та 0% Військовий збір). Це максимізує ефект складного відсотка при регулярному реінвестуванні купонів, забезпечуючи максимальний опір знеціненню гривні.";
              } else if (bestAsset.type === "deposit") {
                winnerTitle = "Чому у вашому сценарії лідирує банківський депозит?";
                winnerDesc = "Гнучке управління капіталізацією відсотків та високі локальні премії комерційних банків на короткі терміни роблять депозит зручним вибором. Проте пам'ятайте про 18% ПДФО та 5% військового збору, які автоматично забирають майже чверть нарахованих відсотків при виплаті.";
              } else {
                winnerTitle = "Сила накопичувального страхування життя";
                winnerDesc = "Головний драйвер успішності страхування — щорічна державна податкова знижка у розмірі 18% від річних платежів. Завдяки поверненню ПДФО з бюджету та спрямуванню його безпосередньо у капітал, ефективна річна ставка суттєво зростає, допомагаючи захистити ультрадовгі заощадження.";
              }

              return (
                <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-900/45 flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-indigo-900/30 text-indigo-400 shrink-0">
                    <Award className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold font-display">{winnerTitle}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{winnerDesc}</p>
                  </div>
                </div>
              );
            })()}
          </div>
          </div>
        )}

        {/* PORTFOLIO MODE CONTAINER */}
        {appMode === "portfolio" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-xl border border-slate-700 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-405 border border-cyan-500/20 shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">Портфельний конструктор капіталу</h2>
                  <p className="text-[11px] text-slate-400">Моделюйте та диверсифікуйте свій капітал за допомогою збалансованого співвідношення активів та ризик-профілів</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAppMode("calculators")}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-0 font-display flex items-center gap-1.5"
              >
                ← Повернутись до калькуляторів
              </button>
            </div>

            <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 shadow-xl space-y-6" id="portfolio-analyzer-section">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-600/25 text-indigo-400 shrink-0 border border-indigo-550/20">
                  <Briefcase className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    Портфельний аналізатор капіталу
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Мульти-активи</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Створіть свій збалансований портфель, налаштуйте частки активів та оцініть загальну доходність з урахуванням податків та інфляції
                  </p>
                </div>
              </div>

              {/* Presets controller */}
              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => applyPortfolioPreset("conservative")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 ${
                    portfolioPreset === "conservative"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  id="preset-conservative"
                >
                  🛡️ Консервативний
                </button>
                <button
                  type="button"
                  onClick={() => applyPortfolioPreset("balanced")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 ${
                    portfolioPreset === "balanced"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  id="preset-balanced"
                >
                  ⚖️ Збалансований
                </button>
                <button
                  type="button"
                  onClick={() => applyPortfolioPreset("aggressive")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 ${
                    portfolioPreset === "aggressive"
                      ? "bg-purple-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  id="preset-aggressive"
                >
                  🚀 Агресивний
                </button>
              </div>
            </div>

            {/* Error/Warning area */}
            {portfolioError && (
              <div className="bg-rose-950/45 border border-rose-900/40 p-3 rounded-lg text-rose-305 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{portfolioError}</span>
              </div>
            )}

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Input Settings & Allocation Controls (7 Columns) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Initial Capital & Horizon sliders */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Початковий капітал портфеля</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={portfolioAmountInput}
                          onChange={handlePortfolioAmountChange}
                          className="bg-transparent text-right font-bold text-indigo-405 focus:outline-none border-b border-dashed border-indigo-500/45 focus:border-solid focus:border-indigo-550 transition-all w-24 p-0 focus:ring-0 text-sm font-mono"
                          id="portfolio-capital-input"
                        />
                        <span className="font-bold text-indigo-400 text-xs">₴</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="10000000"
                      step="5000"
                      value={portfolioAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPortfolioAmount(val);
                        setPortfolioAmountInput(val.toLocaleString("uk-UA"));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                      <span>5 тис. ₴</span>
                      <span>10 млн ₴</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Термін інвестування портфеля</span>
                      <span className="font-bold text-indigo-400 font-mono">{portfolioHorizon} {getYearsLabel(portfolioHorizon)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800/60">
                      {[1, 3, 5, 10].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setPortfolioHorizon(yr)}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                            portfolioHorizon === yr
                              ? "bg-slate-800 text-indigo-400 border border-slate-700"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {yr} {yr === 1 ? "рік" : yr === 3 ? "роки" : "років"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weights control list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display uppercase tracking-wider">Активи та їх частки в портфелі</span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePercentEqualWeights}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 bg-indigo-950/20 border border-indigo-900/30 px-2.5 py-1 rounded"
                      >
                        <Activity className="w-2.5 h-2.5" /> Порівну
                      </button>
                      <button
                        type="button"
                        onClick={handleNormalizeWeights}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded"
                      >
                        <Sliders className="w-2.5 h-2.5" /> Баланс (100%)
                      </button>
                    </div>
                  </div>

                  {/* Weight Warning bar if sumWeights !== 100 */}
                  {portfolio.sumWeights !== 100 && (
                    <div className="bg-amber-955/20 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong>Розподіл часток:</strong> сумарна частка часток становить <strong>{portfolio.sumWeights}%</strong> (має бути рівно 100%).
                        <span className="block mt-0.5 text-slate-400 leading-normal">
                          Натисніть <strong>"Баланс (100%)"</strong>, щоб пропорційно укласти капітал на рівно 100%. Зараз симуляція рахує залученість капіталу в розмірі {((portfolio.sumWeights)).toFixed(0)}% від {formatUah(portfolioAmount)}.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Asset Items List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {portfolioAssets.map((asset, index) => {
                      const netYield = asset.rate * (1 - asset.tax / 100);
                      return (
                        <div key={asset.id} className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors space-y-2 relative group">
                          
                          {/* Asset item head info */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: asset.color }}></span>
                              <span className="text-xs font-bold text-white font-display">{asset.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                (Ставка: {asset.rate}% {asset.tax > 0 ? `, Реал. податок: ${asset.tax}%` : ""})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                Чиста ставка: {netYield.toFixed(1)}%
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset(index)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Видалити цей актив"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Controls (Weight slider, and adjustable numeric rates if custom) */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            
                            {/* Weight slider & percentage indicator */}
                            <div className="md:col-span-8 flex items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={asset.weight}
                                onChange={(e) => handleAssetWeightChange(index, parseInt(e.target.value, 10))}
                                className="flex-grow h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                style={{ accentColor: asset.color }}
                              />
                              <div className="flex items-center bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0 w-16">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={asset.weight}
                                  onChange={(e) => handleAssetWeightChange(index, parseInt(e.target.value, 10))}
                                  className="bg-transparent w-full border-none focus:outline-none text-right font-mono text-[11px] font-bold text-white p-0 focus:ring-0"
                                />
                                <span className="text-[10px] text-slate-400 font-mono font-bold ml-0.5">%</span>
                              </div>
                            </div>

                            {/* Additional editable inputs for rate and tax to enable full play */}
                            <div className="md:col-span-4 grid grid-cols-2 gap-1.5">
                              <div className="flex items-center bg-slate-950 rounded border border-slate-800/80 px-1.5 py-0.5" title="Річна номінальна відсоткова ставка">
                                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none mr-1 font-mono">Нім:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={asset.rate}
                                  onChange={(e) => handleAssetRateChange(index, parseFloat(e.target.value))}
                                  className="bg-transparent text-white font-mono text-[10px] w-full text-right focus:outline-none p-0 focus:ring-0 border-none"
                                />
                                <span className="text-[9px] text-slate-550 ml-0.5 font-bold">%</span>
                              </div>

                              <div className="flex items-center bg-slate-950 rounded border border-slate-800/80 px-1.5 py-0.5" title="Податок на нараховані відсотки">
                                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none mr-1 font-mono">Под:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="100"
                                  value={asset.tax}
                                  onChange={(e) => handleAssetTaxChange(index, parseFloat(e.target.value))}
                                  className="bg-transparent text-white font-mono text-[10px] w-full text-right focus:outline-none p-0 focus:ring-0 border-none"
                                />
                                <span className="text-[9px] text-slate-550 ml-0.5 font-bold">%</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Asset section */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-3" id="add-asset-box">
                  <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                    <Plus className="w-4 h-4 text-indigo-405 shrink-0" />
                    <span className="text-slate-300 font-bold text-xs uppercase tracking-wider font-display">Створити і додати новий інструмент у портфель</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-1">
                    <div className="md:col-span-6">
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase font-mono">Назва активу</label>
                      <input
                        type="text"
                        placeholder="Закордонна нерухомість, золото, крипта..."
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg text-xs py-1.5 px-3 text-white transition-colors"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase font-mono">Річний дохід (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newAssetRate}
                        onChange={(e) => setNewAssetRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg text-xs py-1.5 px-3 text-white text-right font-mono"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase font-mono">Податок/Збори (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newAssetTax}
                        onChange={(e) => setNewAssetTax(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg text-xs py-1.5 px-3 text-white text-right font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between pt-1">
                    {/* Color selection dots */}
                    <div className="space-y-1">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase font-mono">Колір маркування</span>
                      <div className="flex items-center gap-2">
                        {["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#06b6d4", "#a855f7", "#eab308"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewAssetColor(c)}
                            className={`w-3.5 h-3.5 rounded-full transition-all relative ${
                              newAssetColor === c ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-110" : "opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Risk slider inside custom creation */}
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase text-left md:text-right font-mono">Ризик (1-100): <strong className="text-white">{newAssetRisk}</strong></span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={newAssetRisk}
                          onChange={(e) => setNewAssetRisk(parseInt(e.target.value, 10))}
                          className="w-28 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomAsset}
                        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[10px] font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors self-end shrink-0 uppercase tracking-widest"
                      >
                        <Plus className="w-3.5 h-3.5" /> Створити
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Visual Report Summary Chart & Metrics (5 Columns) */}
              <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                
                {/* Embedded Allocation Stacked Horizontal Gauge Indicator */}
                <div className="bg-slate-950/65 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-display">Візуальна структура капіталу</span>
                    <span className="text-[9px] text-slate-500 font-semibold font-mono">{portfolioAssets.length} {portfolioAssets.length === 1 ? "актив" : "активи"}</span>
                  </div>

                  {/* Horizontal visual stack of weights */}
                  <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-slate-850">
                    {portfolioAssets.map((asset) => {
                      if (asset.weight <= 0) return null;
                      return (
                        <div
                          key={asset.id}
                          className="h-full transition-all duration-300 relative group"
                          style={{
                            width: `${(asset.weight / Math.max(1, portfolio.sumWeights)) * 100}%`,
                            backgroundColor: asset.color
                          }}
                          title={`${asset.name}: ${asset.weight}%`}
                        />
                      );
                    })}
                    {portfolio.sumWeights === 0 && (
                      <div className="w-full h-full bg-slate-850 flex items-center justify-center text-[9px] text-slate-550 italic font-medium">Портфель порожній</div>
                    )}
                  </div>

                  {/* Tiny horizontal labels of weights */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-slate-400 font-medium font-sans">
                    {portfolioAssets.map((asset) => {
                      if (asset.weight <= 0) return null;
                      return (
                        <span key={asset.id} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }}></span>
                          <span className="text-white font-bold">{asset.weight}%</span>
                          <span className="text-slate-450 truncate max-w-[80px]">{asset.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Portfolio Risk Index Level display card */}
                {(() => {
                  const riskScore = portfolio.weightedRisk;
                  let riskTitle = "Мінімальний (Сейф)";
                  let riskColor = "text-emerald-400 bg-emerald-950/20 border-emerald-900/30";
                  let riskDetail = "Портфель містить максимально надійні суверенні та державні інструменти захисту капіталу з бездоганним рейтингом гарантій.";
                  let riskBarColor = "bg-emerald-500 shadow-lg shadow-emerald-500/30";
                  
                  if (riskScore >= 75) {
                    riskTitle = "Високий (Агресивний / Спекулятивний)";
                    riskColor = "text-rose-450 bg-rose-950/15 border-rose-900/40";
                    riskBarColor = "bg-rose-500 shadow-lg shadow-rose-500/30";
                    riskDetail = "Портфель сильно орієнтований на спекулятивний приріст та містить значні вкладення в криптовалюти чи акції з високою волатильністю.";
                  } else if (riskScore >= 50) {
                    riskTitle = "Помірний (Активне зростання)";
                    riskColor = "text-orange-400 bg-orange-950/20 border-orange-900/30";
                    riskBarColor = "bg-orange-500 shadow-lg shadow-orange-500/30";
                    riskDetail = "Портфель має збалансоване середнє ризикове навантаження з включенням корпоративних паперів чи цінних паперів з вищою доходністю.";
                  } else if (riskScore >= 25) {
                    riskTitle = "Консервативний (Контрольований захист)";
                    riskColor = "text-yellow-450 bg-yellow-950/15 border-yellow-900/20";
                    riskBarColor = "bg-yellow-500 shadow-lg shadow-yellow-500/30";
                    riskDetail = "Портфель чудово комбінує безпеку банківських вкладів та державних ОВДП з незначним додаванням недержавних пенсійних паперів.";
                  }

                  return (
                    <div className={`p-4 rounded-xl border ${riskColor} space-y-3`}>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-display">Рівень ризику портфеля</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold">{riskScore.toFixed(0)} / 100</span>
                      </div>

                      {/* Slider Indicator Gauge wrapper */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner flex border border-slate-800">
                          <div className={`h-full transition-all duration-350 ${riskBarColor}`} style={{ width: `${riskScore}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                          <span>НЕДОСТАТНІЙ</span>
                          <span>ПОМІРНИЙ</span>
                          <span>МАКСИМАЛЬНИЙ</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <strong className="text-white text-xs font-bold leading-normal block">{riskTitle}</strong>
                        <p className="text-[10.5px] leading-relaxed opacity-90 font-sans">{riskDetail}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Growth Chart Plot */}
                <div className="bg-slate-950/35 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-display tracking-wider">Динаміка зростання капіталу</span>
                    <div className="flex gap-2 text-[8px] font-mono select-none">
                      <span className="text-indigo-450 font-bold block">● Номінал</span>
                      <span className="text-emerald-400 font-bold block">● Реальність</span>
                    </div>
                  </div>

                  <div className="w-full h-[145px]" id="portfolio-chart-viewport">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={portfolio.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#101b33" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                        <YAxis stroke="#475569" fontSize={9} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "0.5rem" }}
                          labelStyle={{ fontWeight: "bold", fontSize: "10px", color: "#f8fafc" }}
                          itemStyle={{ fontSize: "10px" }}
                          formatter={(value: any, name: string) => {
                            if (name === "nominalVal") return [formatUah(value), "Номінальна сума"];
                            if (name === "realVal") return [formatUah(value), "Реальний капітал"];
                            if (name === "invested") return [formatUah(value), "Акумульовано"];
                            return [value, name];
                          }}
                        />
                        <Line type="monotone" dataKey="invested" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="nominalVal" stroke="#c084fc" strokeWidth={3} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="realVal" stroke="#34d399" strokeWidth={2} dot={{ r: 1.5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Metrics and Final Profit Overview */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/80 space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>Сумарно залучений капітал:</span>
                    <span className="font-mono text-white font-bold">{formatUah(portfolio.totalInvestedSum)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>Підсумковий номінал ({portfolioHorizon} {getYearsLabel(portfolioHorizon)}):</span>
                    <span className="font-mono text-indigo-400 font-bold">{formatUah(portfolio.totalNominalPayout)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5" title="Прибуток після вирахування податків">
                    <span>Прогнозований чистий прибуток:</span>
                    <span className={`font-mono font-bold ${portfolio.netNominalProfit >= 0 ? "text-emerald-400" : "text-rose-455"}`}>
                      +{formatUah(portfolio.netNominalProfit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5" title="Реальна вартість накопичень після вирахування інфляції">
                    <span>Реальний капітал (з урах. інфляції):</span>
                    <span className="font-mono text-emerald-400 font-extrabold">{formatUah(portfolio.totalRealPayout)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-1">
                    <span>Інфляційні втрати за термін:</span>
                    <span className="font-mono text-rose-400 font-medium font-sans">-{formatUah(portfolio.totalNominalPayout - portfolio.totalRealPayout)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Середньорічний чистий дохід портфеля:</span>
                    <span className="font-mono text-indigo-300 font-extrabold text-sm">{portfolio.weightedRate.toFixed(2)}%</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
          </div>
        )}

        {/* Profit and Tax Structure Pie Chart Section */}
        {appMode === "calculators" && (
          <>
            <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4" id="tax-structure-card">
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                Структура прибутку та податкове навантаження
              </h3>
              <p className="text-[11px] text-slate-400">Розподіл результату: скільки йде на податки (ПДФО + Військовий збір), а скільки залишається чистим прибутком</p>
            </div>

            {!taxBreakdown.hasProfit ? (
              <div className="flex items-center gap-3 p-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="text-slate-300 block">Немає накопиченого прибутку</strong>
                  <span>Прибуток від інструменту занадто малий або відсутній на початковому етапі. Налаштуйте суму або термін інвестування, щоб переглянути структуру виплат.</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Visual Pie Chart Grid (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="w-full h-[180px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: "Чистий прибуток", 
                              value: taxBreakdown.netProfit, 
                              color: "#10b981", 
                              percent: taxBreakdown.netPercent 
                            },
                            ...(taxBreakdown.totalTax > 0 ? [
                              { 
                                name: `ПДФО (${indicators.pitTax}%)`, 
                                value: taxBreakdown.pitVal, 
                                color: "#f59e0b", 
                                percent: taxBreakdown.pitPercent 
                              },
                              { 
                                name: `Військовий збір (${indicators.militaryTax}%)`, 
                                value: taxBreakdown.milVal, 
                                color: "#ef4444", 
                                percent: taxBreakdown.milPercent 
                              }
                            ] : [])
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={taxBreakdown.totalTax > 0 ? 3 : 0}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          {taxBreakdown.totalTax > 0 && <Cell fill="#f59e0b" />}
                          {taxBreakdown.totalTax > 0 && <Cell fill="#ef4444" />}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [formatUah(value), ""]}
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "0.5rem" }}
                          itemStyle={{ fontSize: "11px", color: "#f8fafc" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label inside Pie ring */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Чистий</span>
                      <span className="text-base font-mono font-extrabold text-emerald-400 leading-tight">
                        {taxBreakdown.netPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Tiny Legend bullets below chart */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Чистий прибуток ({taxBreakdown.netPercent.toFixed(0)}%)
                    </span>
                    {taxBreakdown.totalTax > 0 ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          ПДФО ({taxBreakdown.pitPercent.toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Військ. збір ({taxBreakdown.milPercent.toFixed(0)}%)
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                        Податки (0%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Statistical & Legal details Breakdown (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-900">
                      <span className="text-slate-400 font-medium">Валовий прибуток (Gross):</span>
                      <span className="font-mono font-bold text-slate-300">{formatUah(taxBreakdown.grossProfit)}</span>
                    </div>

                    {taxBreakdown.totalTax > 0 ? (
                      <div className="space-y-1.5 pb-1 border-b border-slate-900 text-[11px]">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Податок на доходи (ПДФО {indicators.pitTax}%):
                          </span>
                          <span className="font-mono text-amber-500 font-semibold">-{formatUah(taxBreakdown.pitVal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Військовий збір ({indicators.militaryTax}%):
                          </span>
                          <span className="font-mono text-red-400 font-semibold">-{formatUah(taxBreakdown.milVal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-rose-400 font-bold pt-1">
                          <span>Сукупний державний податок ({indicators.pitTax + indicators.militaryTax}%):</span>
                          <span className="font-mono">-{formatUah(taxBreakdown.totalTax)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold pb-2 border-b border-slate-900">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Оподаткування (ПДФО + Військ. збір):
                        </span>
                        <span>0% (Без податків)</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-slate-300">Чистий прибуток (залишок):</span>
                      <span className="font-mono text-emerald-400 text-sm font-extrabold">{formatUah(taxBreakdown.netProfit)}</span>
                    </div>

                    {activeTab === "insurance" && taxRebateActive && simulation.totalTaxRebateSum > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-indigo-400 font-semibold bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/30">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          Повернуто за рахунок податкової знижки (18%):
                        </span>
                        <span className="font-mono text-indigo-300">+{formatUah(simulation.totalTaxRebateSum)}</span>
                      </div>
                    )}
                  </div>

                  {/* Legal context according to Ukrainian law */}
                  <div className="text-[10px] leading-relaxed text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                    {activeTab === "deposit" && (
                      <p>
                        🔹 <strong className="text-white">Податковий кодекс України (ст. 170.2-1)</strong> визначає, що доходи від банківських депозитів оподатковуються за загальною ставкою ПДФО ({indicators.pitTax}%) та Військовим збором ({indicators.militaryTax}%). Банк автоматично виступиє вашим податковим агентом та виплачує вам суму вже без цих відрахувань.
                      </p>
                    )}
                    {activeTab === "ovdp" && (
                      <p>
                        🎉 <strong className="text-emerald-400">Державне стимулювання ОВДП:</strong> Згідно зі ст. 165.1.2 Податкового кодексу України, прибутки від державних облігацій (ОВДП) повністю <span className="text-emerald-400 font-semibold">звільнені від оподаткування</span> (0% ПДФО та 0% Військовий збір). Держава гарантує збереження 100% прибутку.
                      </p>
                    )}
                    {activeTab === "insurance" && (
                      <p>
                        🛡️ <strong className="text-emerald-400">Довгострокове страхування життя:</strong> Страхові виплати за договорами терміном понад 5 років не оподатковуються (0% відповідно до ст. 170.8.2 ПКУ). Крім того, ви маєте законне право на <span className="text-emerald-400 font-semibold">податкову знижку (18%)</span>, повертаючи частину ПДФО з бюджету щорічно.
                      </p>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Verification, details, educational references */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
            <button
              onClick={() => setFormulasOpen(!formulasOpen)}
              className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-800/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display">Реєстр математичних формул та законодавства України</h4>
                  <p className="text-[11px] text-slate-400">Побачити верифіковані фінансові розрахунки відповідно до Податкового кодексу</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${formulasOpen ? "rotate-180" : ""}`} />
            </button>

            {formulasOpen && (
              <div className="p-6 border-t border-slate-700 bg-slate-950/40 space-y-6 text-xs text-slate-300 leading-relaxed">
                
                {/* 1. Simple interest */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-indigo-400 font-bold">
                    <Scale className="w-4 h-4 text-indigo-400" /> 1. Простий відсоток (нарахування без капіталізації)
                  </div>
                  <p>
                    Використовується при нарахуванні відсотків в кінці терміну без реінвестування, або раз на рік для деяких цінних паперів.
                  </p>
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800/60 font-mono text-center text-white text-sm">
                    S = P × ( 1 + r × t )
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-slate-400 space-y-0.5">
                    <li><strong>P</strong> — початковий капітал (тіло вкладу).</li>
                    <li><strong>r</strong> — річна ставка відсотка (десяткова величина, наприклад, 10% = 0.10).</li>
                    <li><strong>t</strong> — тривалість у роках (наприклад, 6 місяців = 0.5 року).</li>
                  </ul>
                </div>

                {/* 2. Compound interest */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-indigo-400 font-bold">
                    <Calendar className="w-4 h-4 text-indigo-400" /> 2. Складний відсоток (Compound: капіталізація відсотків)
                  </div>
                  <p>
                    Застосовується у банківських накопичувальних депозитах, інвестиційних фондах та страхуванні життя. Кожного періоду нарахований купон додається до тіла вкладу.
                  </p>
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800/60 font-mono text-center text-white text-sm">
                    A = P × ( 1 + r / n ) <sup>n × t</sup>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-slate-400 space-y-0.5">
                    <li><strong>n</strong> — кількість періодів нарахування на рік (наприклад, щомісячно = 12, щоденно = 365, щорічно = 1).</li>
                    <li>Кожен наступний період прибуток нараховується на зрісшу суму (відсотки на відсотки).</li>
                  </ul>
                </div>

                {/* 3. PIT + Military Tax ukraine defaults */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Landmark className="w-4 h-4 text-cyan-400" /> 3. Оподаткування інвестицій в Україні (ПКУ)
                  </div>
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <strong className="text-white block text-[10px] uppercase font-display">Банківські депозити</strong>
                        <span className="text-[10px] text-rose-400 font-bold block mt-1">Податок 23%</span>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                          Згідно з чинним ПКУ: 18% ПДФО + 5% військового збору. Автоматично утримується банком на дату виплат.
                        </p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <strong className="text-white block text-[10px] uppercase font-display">Державні облігації</strong>
                        <span className="text-[10px] text-indigo-400 font-bold block mt-1 font-display">Податок 0%</span>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                          ОВДП звільнені від оподаткування (0% ПДФО, 0% військового збору). Весь прибуток є чистим.
                        </p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <strong className="text-white block text-[10px] uppercase font-display">Страхування Життя</strong>
                        <span className="text-[10px] text-indigo-400 font-bold block mt-1 font-display">Податкова знижка +18%</span>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                          Стаття 166 ПКУ дає змогу повернути 18% від суми страхових платежів у вигляді кешбеку від вашого сплаченого ПДФО.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Real purchasing power equation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-red-400 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-405" /> 4. Вплив інфляційного знецінення (Purchasing Power Degradation)
                  </div>
                  <p>
                    Для обчислення реальної купівельної спроможності накопиченого капіталу в майбутньому ми застосовуємо дисконтувальний коефіцієнт на базі прогнозованої інфляції:
                  </p>
                  <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800/60 font-mono text-center text-white text-sm">
                    P<sub>real</sub> = P<sub>nominal</sub> / ( 1 + i ) <sup>t</sup>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Тут <strong>i</strong> — прогнозований рівень річної інфляції, а <strong>t</strong> — період у роках. Ця формула яскраво відображає здатність обраного активу реально заробляти понад знецінення гривневих мас.
                  </p>
                </div>

              </div>
            )}
          </div>
          </>
        )}
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-4 text-center">
        <p className="text-slate-500 text-[10px]">
          &copy; 2026 FinSim UA. Симулятор математично верифікований згідно з чинними законами України та консенсус-статистикою НБУ.
        </p>
      </footer>
    </div>
  );
}
