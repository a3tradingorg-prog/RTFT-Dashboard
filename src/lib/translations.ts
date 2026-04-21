export type Language = 'en' | 'mm';

export interface QAItem {
  id: string;
  question: {
    en: string;
    mm: string;
  };
  answer: {
    en: string;
    mm: string;
  };
  category: {
    en: string;
    mm: string;
  };
}

export const QA_TRANSLATIONS: QAItem[] = [
  {
    id: '1',
    category: {
      en: 'Future Trading Requirements',
      mm: 'Future Trading အတွက် လိုအပ်ချက်များ'
    },
    question: {
      en: 'What kind of card is needed to purchase Prop Firm accounts?',
      mm: 'Propfirm ကနေ account ဝယ်ဖို့ ဘယ်လို card မျိုး လိုအပ်ပါသလဲ?'
    },
    answer: {
      en: 'You need a Visa card to purchase a Futures account from a Prop Firm. Personally, I do not use Visa cards from official banks due to security concerns. I use crypto Visa cards instead. There are many options for crypto Visa cards, both KYC-required and non-KYC. I will explain more about crypto Visa cards in a separate section.',
      mm: 'Future account အတွက် Propfirm ကနေ ဝယ်ဖို့ အတွက် visa card လိုပါတယ်။ (Personally အရ official bank ကနေ ရတဲ့ visa card ကို မသုံးပါဘူး။ ဘာလို့လဲဆိုတော့ security အတွက်ရော စိတ်မချလို့ မသုံးတာပါ။ Visa card ကို crypto visa card တွေနဲ့ပဲ သုံးပါတယ်။ Crypto visa card တွေကတော့ verify လုပ်စရာ လိုတာ မလိုတာတွေရော ရွေးချယ်စရာတွေ အများကြီး ရှိပါတယ်။ crypto visa card အကြောင်း သီးသန့် ထပ်ပြောထားပေးပါမယ်။)'
    }
  },
  {
    id: '2',
    category: {
      en: 'Verification & KYC',
      mm: 'Verification & KYC'
    },
    question: {
      en: 'What is required for account verification after passing?',
      mm: 'Account အောင်ပြီးသွားရင် verify လုပ်ဖို့ ဘာတွေ လိုအပ်ပါသလဲ?'
    },
    answer: {
      en: 'Once you pass the evaluation, you need a Rise account for verification. Additionally, having a Thai Driving License is highly recommended. Some firms have restrictions on Myanmar citizens, so using a passport for KYC is generally not encouraged in those cases.',
      mm: 'Account အောင်ပြီးသွားရင် verify လုပ်ဖို့ အတွက် Rise account တစ်ခု ရှိဖို့လိုအပ်ပါတယ်။ နောက်တစ်ခုက ထိုင်း Driving License ရှိထားတာ ပိုကောင်းပါတယ်။ (တချို့ firm တွေက Myanmar citizen ban တာတွေ ရှိတာကြောင့်မို့လို့ passport နဲ့ KYC တင်တာကို အားမပေးပါဘူး။)'
    }
  },
  {
    id: '3',
    category: {
      en: 'Verification & KYC',
      mm: 'Verification & KYC'
    },
    question: {
      en: 'Are there alternative KYC methods?',
      mm: 'KYC အတွက် တခြား နည်းလမ်းတွေ ရှိပါသေးလား?'
    },
    answer: {
      en: 'For account KYC, some firms may accept or require a Workmarket account. Having one provides you with more flexibility and options across different proprietary firms.',
      mm: 'Account KYC အတွက် တချို့ Firm တွေက Workmarket account နဲ့ တောင်းတတ်တယ်။ ရှိထားရင်တော့ ရွေးချယ်စရာ များများ ရှိတာပေါ့။'
    }
  },
  {
    id: '4',
    category: {
      en: 'Payout Methods',
      mm: 'Payout ရယူခြင်း'
    },
    question: {
      en: 'How can I receive my trading payouts?',
      mm: 'Payout ကို ဘယ်လို လက်ခံလို့ ရမလဲ?'
    },
    answer: {
      en: 'For payouts, you can use Rise. Alternatively, some firms allow direct payouts to your crypto wallet. Therefore, it is essential to have a crypto wallet set up and ready.',
      mm: 'Payout အတွက်တော့ Rise နဲ့လက်ခံလို့ ရမယ်။ နောက်တစ်ခု အနေနဲ့ တချို့ Firm တွေက crypto နဲ့ တိုက်ရိုက်လက်ခံလို့ ရမယ်။ အဲ့ဒါအတွက် Crypto wallet တစ်ခု ရှိထားရမယ်။'
    }
  },
  {
    id: '5',
    category: {
      en: 'Crypto & Liquidation',
      mm: 'Crypto & ငွေဖော်ခြင်း'
    },
    question: {
      en: 'How should I liquidate or hold my crypto earnings?',
      mm: 'ရလာတဲ့ Crypto တွေကို ဘယ်လို ငွေဖော်ပြီး သိမ်းဆည်းသင့်သလဲ?'
    },
    answer: {
      en: 'To liquidate crypto, it is better to use exchanges like Bitazza or Bitkub, which are regulated by the Thai SEC. Personally, I no longer use Binance due to reliability concerns and excessive personal verification requirements. For long-term holding, using a Cold Wallet is highly recommended. You can find detailed crypto tutorial videos on the RTFT website.',
      mm: 'Crypto liquidate အတွက်ကိုတော့ ထိုင်းရဲ့ SEC ကို pass ထားတဲ့ Bitazza သို့မဟုတ် Bitkub လိုမျိုး exchange ကနေ exchange လုပ်တာ ပိုကောင်းပါတယ်။ (Personally အရတော့ Binance ကို လုံးဝမသုံးတော့ပါဘူး။ စိတ်ချရတဲ့ Buyer/seller အတွက် confidence မရှိတာရော၊ Personal information ထပ်တောင်းပြီး verify လုပ်ခိုင်းတာတွေရောကြောင့် ကျွန်တော် လုံးဝမသုံးတော့ပါဘူး။) Crypto ကို holding လုပ်မယ်ဆိုရင်တော့ Cold wallet နဲ့ပဲ holding လုပ်တာ ပိုကောင်းပါတယ်။ (Crypto အကြောင်းတွေ ပြောထားတဲ့ video တွေ RTFT Website ထဲမှာ ရှိပါတယ်)'
    }
  }
];

export const UI_TRANSLATIONS = {
  qaTitle: {
    en: 'Q&A Knowledge Base',
    mm: 'Q&A အမေးအဖြေ ကဏ္ဍ'
  },
  searchPlaceholder: {
    en: 'Search knowledge...',
    mm: 'ဗဟုသုတများ ရှာဖွေရန်...'
  },
  languageToggle: {
    en: 'English',
    mm: 'မြန်မာဘာသာ'
  }
};
