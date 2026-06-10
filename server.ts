import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely with the correct official API key and telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. Endpoint for verified macroeconomic parameters for Ukraine (2026 consensus with real-time NBU API sync)
app.get("/api/indicators", async (req, res) => {
  let usdUahRate = 41.20;               // Розрахунковий орієнтир за замовчуванням
  let nbuKeyRate = 13.0;                // Облікова ставка за замовчуванням

  try {
    // Спроба отримати актуальний офіційний курс долара США від НБУ
    const usdRes = await fetch("https://bank.gov.ua/NBUStatService/v1/statist/exchange?valcode=USD&json");
    if (usdRes.ok) {
      const usdData = await usdRes.json() as any;
      if (Array.isArray(usdData) && usdData.length > 0 && typeof usdData[0].rate === "number") {
        usdUahRate = usdData[0].rate;
        console.log(`[NBU API Sync] Successfully fetched current USD rate: ${usdUahRate} UAH`);
      }
    }
  } catch (err) {
    console.warn("[NBU API Sync] Fail to fetch live USD rate from NBU, using safety fallback:", err);
  }

  try {
    // Спроба отримати діючу облікову ставку НБУ
    const keyRateRes = await fetch("https://bank.gov.ua/NBUStatService/v1/statist/directory/key_rate?json");
    if (keyRateRes.ok) {
      const keyRateData = await keyRateRes.json() as any;
      if (Array.isArray(keyRateData) && keyRateData.length > 0 && typeof keyRateData[0].val === "number") {
        nbuKeyRate = keyRateData[0].val;
        console.log(`[NBU API Sync] Successfully fetched NBU key rate: ${nbuKeyRate}%`);
      }
    }
  } catch (err) {
    console.warn("[NBU API Sync] Fail to fetch live key rate from NBU, using safety fallback:", err);
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    indicators: {
      nbuKeyRate,                     // НБУ облікова ставка
      uird12mUah: 11.5,               // UIRD 12 місяців у гривні (депозити)
      ovdpYieldUah: 15.2,             // Середня ставка гривневих ОВДП
      inflationRate: 6.8,             // Прогнозований рівень інфляції в Україні (%)
      usdUahRate,                     // Курс долара США (НБУ)
      avgDevaluation: 4.2,            // Річний прогноз девальвації гривні (%)
      militaryTax: 5.0,               // Військовий збір у 2026 (%)
      pitTax: 18.0,                   // Податок на доходи фізичних осіб (ПДФО) (%)
      insuranceTaxRebate: 18.0,       // Податкова знижка за страхування життя (%)
    }
  });
});

// 2. Endpoint for AI portfolio auditing under Ukrainian legislation and inflation impacts
app.post("/api/analyze", async (req, res) => {
  try {
    const {
      calculator, // 'insurance' | 'deposit' | 'ovdp'
      principal,
      monthlyPayment,
      termYears,
      termMonths,
      ratePercent,
      taxPercent,
      inflationPercent,
      selectedComparisonAsset,
      calculatedMainYield,
      calculatedMainProfit,
      calculatedComparisonYield,
      comparisonLabel,
      taxRebateActive,
      totalTaxRebateSum,
      fxRate,
      fxDevaluation,
    } = req.body;

    const systemInstruction = 
      "Ви виступаєте як висококваліфікований фінансовий радник та експерт з інвестицій в Україні. " +
      "Ваше завдання - надати детальний, математично та юридично обґрунтований фінансовий аудит " +
      "обраної інвестиційної схеми користувача українською мовою. " +
      "Завжди спирайтеся на українське законодавство: " +
      "1) ОВДП повністю звільнені від оподаткування (0% ПДФО та 0% Військового збору) відповідно до ПКУ. " +
      "2) Депозити фізичних осіб оподатковуються: ПДФО 18% + Військовий збір (зараз становить 5.0%, сумарно 23% на доходи по депозитах). " +
      "3) Накопичувальне страхування життя (НСЖ) підлягає отриманню податкової знижки (стаття 166 ПКУ), що дозволяє щорічно повертати 18% від суми внесків (в межах лімітів). " +
      "Пишіть чітко, структуровано, професійно, використовуючи списки та виділення жирним ключових понять. Уникайте загальних порад, робіть акцент на цифрах, реальній прибутковості з урахуванням інфляції та валютного ризику.";

    const prompt = `
Аналiз інвестиційного портфеля:
- Інструмент моделювання: ${calculator === 'insurance' ? 'LifeCare (Накопичувальне страхування життя)' : calculator === 'deposit' ? 'Гривневий Депозит' : 'Державні ОВДП'}
- Початкова сума / Вклад: ${principal} грн.
- Щомісячний внесок (для страхування): ${monthlyPayment || 0} грн/міс.
- Термін: ${termYears ? termYears + ' років' : termMonths + ' місяців'}
- Номінальна річна ставка: ${ratePercent}%
- Податки на прибуток: ${taxPercent}%
- Очікувана інфляція: ${inflationPercent}% річних.
- Податкова знижка ПДФО (+18%): ${taxRebateActive ? 'Активована' : 'Ні'} (Всього повернуто податків: ${totalTaxRebateSum || 0} грн)
- Порівнюваний актив: ${comparisonLabel} (дохідність: ${req.body.altRate || 0}%, податок: ${req.body.altTax || 0}%)
- Результат основного активу: загальна сума ${calculatedMainYield} грн, чистий накопичений прибуток ${calculatedMainProfit} грн.
- Результат порівнюваного активу: загальна сума ${calculatedComparisonYield} грн.
- Поточний обмінний курс: ₴/${fxRate} з прогнозованою девальвацією ${fxDevaluation}% на рік.

Будь ласка, надайте розгорнутий аудит за такими пунктами:
1. **Математична оцінка реальної прибутковості**: Розрахуйте реальну прибутковість з урахуванням інфляції (${inflationPercent}%) та податків (${taxPercent}%). Поясніть користувачу, чи перекриває цей інструмент інфляційне знецінення капіталу в довгостроковій перспективі.
2. **Юридичний статус та оподаткування**: Проаналізуйте податкові пільги або навантаження відповідно до Податкового кодексу України (наприклад, чому ОВДП мають 0% податків, чи варто задіяти ПДФО-знижку для ЛайфКер тощо).
3. **Порівняльний аналіз**: Порівняйте обраний варіант із ${comparisonLabel}. Дайте конкретний висновок, в яких випадках краще обрати ОВДП, а в яких — депозит чи страхування.
4. **Валютний та девальваційний ризик**: Проаналізуйте, як поведеться капітал у разі девальвації гривні на ${fxDevaluation}% на рік порівняно з валютними або індексними активами.
5. **Стратегічні рекомендації експерта**: Надайте 3 конкретні поради щодо управління цими коштами (наприклад, диверсифікація, реінвестування купонів чи додаткові договори захисту).
`;

    // Call Gemini using the latest supported model 'gemini-3.5-flash'
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Помилка при генерації ШІ-аналізу",
    });
  }
});

// Configure Vite middleware in development or express static client in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runs on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

setupViteOrStatic();
