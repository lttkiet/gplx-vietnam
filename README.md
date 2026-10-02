# Vững Tay Lái

Ứng dụng học độc lập để ôn lý thuyết giấy phép lái xe tại Việt Nam. Bộ dữ liệu hiện có đủ 600 câu theo sáu chương của Cục Cảnh sát giao thông, gồm đáp án, 60 câu điểm liệt và 319 hình minh họa được trích từ tài liệu.

## Chạy cục bộ

```bash
npm install
npm run dev
```

## Nguồn và phạm vi

Ngân hàng câu hỏi: Cục Cảnh sát giao thông, Bộ Công an, *Bộ 600 câu hỏi dùng cho sát hạch lái xe cơ giới đường bộ* (Hà Nội, 2025), ban hành theo Công văn 2262/CSGT-P5 ngày 07/05/2025. [Hướng dẫn chính thức trên Cổng thông tin Chính phủ](https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-bo-600-cau-hoi-dung-de-sat-hach-lai-xe-co-gioi-duong-bo-119250513110514585.htm).

The bank is reproduced with attribution on the basis that Article 15(2) of Vietnam's Intellectual Property Law excludes administrative documents from copyright protection. This is the project's legal interpretation, not legal advice. The app is independent and is not an official examination system. Exam formats can change; check current CSGT guidance before relying on a mock exam.

The question data is in `src/lib/question-bank-2025.json`; extracted question illustrations are in `public/questions/`. Correct answers are mapped from the answer underlines in the source PDF, not a separately published answer key. Official questions do not include explanations, so the app does not invent them.

## Checks

```bash
npm run typecheck
npm run build
```
