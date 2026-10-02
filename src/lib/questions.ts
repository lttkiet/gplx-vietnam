import bank from "@/lib/question-bank-2025.json";

export type Category =
  | "Quy định chung và quy tắc giao thông đường bộ"
  | "Văn hóa giao thông, đạo đức và cứu hộ"
  | "Kỹ thuật lái xe"
  | "Cấu tạo và sửa chữa"
  | "Báo hiệu đường bộ"
  | "Sa hình và xử lý tình huống";

export type Evidence = {
  kind: "official-exam-bank" | "law" | "law-context" | "technical-conflict";
  title: string;
  citation: string;
  url: string;
  quote: string;
};

export type Question = {
  id: number;
  category: Category;
  question: string;
  answers: string[];
  correct: number;
  critical: boolean;
  images: { src: string; width: number; height: number; page: number }[];
  explanation?: string;
  evidence: Evidence[];
};

export const questions = bank.questions as Question[];

export const categories: { name: Category; icon: string; color: string; bg: string }[] = [
  { name: "Quy định chung và quy tắc giao thông đường bộ", icon: "book", color: "#e85b3d", bg: "#fff0ec" },
  { name: "Văn hóa giao thông, đạo đức và cứu hộ", icon: "heart", color: "#278467", bg: "#e9f7f1" },
  { name: "Kỹ thuật lái xe", icon: "car", color: "#a66b1f", bg: "#fff6dc" },
  { name: "Cấu tạo và sửa chữa", icon: "tools", color: "#7656a5", bg: "#f2edfb" },
  { name: "Báo hiệu đường bộ", icon: "sign", color: "#2874a6", bg: "#eaf5fc" },
  { name: "Sa hình và xử lý tình huống", icon: "route", color: "#6e5aac", bg: "#f0edfb" },
];
