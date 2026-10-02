import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { inflateSync } from "node:zlib";

const [pdf, indexDirectory = "/tmp", extractedText = "/tmp/gplx-official-600.txt", extractedXml = "/tmp/gplx-official-600.xml", extractedBbox = "/tmp/gplx-official-600-bbox.html", renderedPagePrefix] = process.argv.slice(2);
if (!pdf) {
  throw new Error("Usage: node scripts/import-csgt-bank.mjs <official-600-question-pdf> [critical-item-index-directory] [text-path] [xml-path] [bbox-path] [rendered-page-prefix]");
}

const officialPdf = "https://ww.csgt.vn/upload/services/2071319603_H%C6%B0%E1%BB%9Bng%20d%E1%BA%ABn%20s%E1%BB%AD%20d%E1%BB%A5ng%20b%E1%BB%99%20c%C3%A2u%20h%E1%BB%8Fi%20s%C3%A1t%20h%E1%BA%A1ch%20GPLX%20%28CV%202262.07.5.2025%29.pdf";
const trafficLawUrl = "https://vanban.chinhphu.vn/?docid=211194&pageid=27160";
const trafficLawContinuationUrl = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/9/36-2024-qh15_tiep.pdf";
const roadLawUrl = "https://vanban.chinhphu.vn/?classid=1&docid=211193&pageid=27160&typegroupid=3";
const alcoholLawUrl = "https://vanban.chinhphu.vn/default.aspx?docid=197311&pageid=27160";
const speedRegulationUrl = "https://vanban.chinhphu.vn/?classid=1&docid=211873&orggroupid=4&pageid=27160";
const penaltiesUrl = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/01/168-nd-cp.signed.pdf";
const criminalCodeUrl = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf";
const speedRegulationIds = new Set(Array.from({ length: 19 }, (_, index) => index + 144));
const roadLawIds = new Set([3, 4, 16, 18]);
const alcoholLawIds = new Set([26]);
const trafficLawContinuationIds = new Set([8, 9, 70, 71, 72, 76, 191, 194, 195, 199, 219, 235, 236, 248, 249, 250]);
const qcvn41Url = "https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2024/11/43387/53148-1-20241359-136051-2024-tt-bgtvt.pdf";
const qcvn41Title = "QCVN 41:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về báo hiệu đường bộ";
const roadPenaltiesUrl = "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-168-2024-nd-cp-43733/54010.htm";
const fireVehicleGuidanceUrl = "https://www.bocongan.gov.vn/bai-viet/mot-so-khuyen-cao-ve-phong-chay-chua-chay-doi-voi-phuong-tien-giao-thong-co-gioi-duong-bo-d2-t15935";
const hondaScooterManualUrl = "https://cdn.honda.com.vn/e-motorbike-manual/July2025/2rJLbr2qyfFX2KoVZGuG.pdf";
const hondaThrottleManualUrl = "https://cdn.honda.com.vn/motorbike-manual/November2024/c6C3VUUgb9glzsVYsBdw.pdf";
const trafficCultureCriteriaUrl = "https://bvhttdl.gov.vn/Pages/chi-tiet.aspx?url=%2Fban-hanh-tieu-chi-van-hoa-giao-thong-duong-bo-4999.htm";
const driverTrainingGuideUrl = "https://cdn.haiphong.gov.vn/gov-hpg/6306/tintuc/2025/2/tl-tap-huan638761839315299303.pdf";
const hyundaiSeatManualUrl = "https://ownersmanual.hyundai.com/full_webhelp/LX3/2026/en_US/id25ce2c31a4c.html";
const hyundaiTireManualUrl = "https://ownersmanual.hyundai.com/full_webhelp/NX4/2025/en_US/id0275f640b05.html";
const hyundaiDieselManualUrl = "https://ownersmanual.hyundai.com/full_webhelp/NX4/2025/en_GN/idcaabfaae6f1.html";
const moitE10Url = "https://moit.gov.vn/tin-tuc/xang-sinh-hoc-e10-hien-thuc-hoa-chu-truong-lon-cua-dang-nha-nuoc.html";
const cleanFuelStatisticsCircularUrl = "https://vbpl.moj.gov.vn/bokehoachvadautu/Pages/vbpq-toanvan.aspx?ItemID=174767&dvid=312";
const consolidatedTrafficLawUrl = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/3/55-vbhn-vpqh.pdf";
const qcvn122Url = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/01/28.qcvn122.2024bgtvt.pdf";
const qcvn09Url = "https://congbaocdn.chinhphu.vn/CongBaoCP/CongBao/2025/1/43784/54132-1-125-126.pdf";
const qcvn14Url = "https://congbao.cdnchinhphu.vn/CongBaoCP/VanBan/2024/11/43772/54127-1-2025121-12248-2024-tt-bgtvt.pdf";
const vehicleAgeDecreeUrl = "https://congbaocdn.chinhphu.vn/180507251028987904/2026/4/13/469237-1776072287_v1_1776073652_signed.pdf";
const fireSafetyLawUrl = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/01/luat55.pdf";
const firstAidManualUrl = "https://adminmoh.moh.gov.vn/documents/20182/0/26.2.2025%2BSo%2Bcap%2Bcuu/09476497-cc2d-4c74-89e8-6129a25f3a1d";
const drivingTechniqueManualUrl = "https://thanhnam-group.com.vn/wp-content/uploads/2024/12/ky-thuat-lai-ban-cuoi19-9-2018.pdf";
const vehicleStructureManualUrl = "https://daotaolaixemientrung.com/uploads/tt-gdnn-mien-trung/2023_01/cau-tao-ban-cuoi-20-09-2018.pdf";
const firstAidArterialBleedingEvidence = {
  title: "Tài liệu huấn luyện sơ cứu, cấp cứu tại nơi làm việc (Bộ Y tế, 2025)",
  citation: "Mục 4.2, Ấn mạch máu",
  url: firstAidManualUrl,
  quote: "Ấn mạch máu (chẹn mạch máu): - Là phương pháp dùng ngón tay ấn đè chặt vào mạch máu ở vị trí phía trên vết thương để máu không chảy xuống dưới."
};
const firstAidBreathingEvidence = {
  title: "Tài liệu huấn luyện sơ cứu, cấp cứu tại nơi làm việc (Bộ Y tế, 2025)",
  citation: "Mục 3.1, Hồi sinh tim phổi",
  url: firstAidManualUrl,
  quote: "Nếu nạn nhân không có dấu hiệu tổn thương cột sống cổ: đặt nằm ngửa trên nền đất cứng hoặc ván cứng, đầu ngửa tối đa để thông thoáng đường thở. Sau khi đặt tư thế nạn nhân sẽ tiến hành ép tim và thổi ngạt."
};
const burnFirstAidEvidence = {
  title: "Hướng dẫn sơ cấp cứu bỏng tại nhà (Bệnh viện Bạch Mai, 2026)",
  citation: "Mục 1–4, Kết luận",
  url: "https://bachmai.gov.vn/bai-viet/so-cap-cuu-bong-tai-nha-nhung-dieu-can-biet?id=564e2d0a-c0eb-4ac0-beca-95daaa2284e3",
  quote: "Đầu tiên, cần nhanh chóng đưa nạn nhân ra khỏi nguồn gây bỏng như nước sôi, dầu mỡ nóng, lửa, khí nóng… để đảm bảo an toàn. Sau đó, loại bỏ quần áo hoặc vật nóng đang bám trên vùng da bị bỏng.\nNếu có khó thở, ngất, hoặc chấn thương kèm theo, cần gọi cấp cứu 115 ngay.\nNgay sau khi đảm bảo an toàn, cần nhanh chóng làm mát vùng da bị bỏng. Cách tốt nhất là dùng nước sạch ở nhiệt độ 16-20°C, tưới nhẹ nhàng lên vùng bỏng 15-30 phút.\nBỏng gây mất nước qua da, vì vậy nếu nạn nhân tỉnh táo, có thể cho uống nước lọc, oresol hoặc nước đường ấm.\nỦ ấm toàn thân bằng chăn sạch để tránh hạ thân nhiệt - một biến chứng nguy hiểm dễ xảy ra ở người bị bỏng.\nSau khi đã sơ cứu đúng bước, người bệnh nên đến cơ sở y tế gần nhất để được đánh giá mức độ bỏng, xử trí chuyên sâu và phòng các biến chứng như nhiễm trùng, sẹo xấu, co kéo."
};
const drivingTechniqueEvidence = (citation, quote) => ({
  title: "Giáo trình Kỹ thuật lái xe ô tô (Tổng cục Đường bộ Việt Nam, 2018)",
  citation,
  url: drivingTechniqueManualUrl,
  quote
});
const automaticStartEvidence = drivingTechniqueEvidence(
  "Mục 2.10.2, Khởi động động cơ",
  "Đối với xe trang bị hộp số tự động, cần kiểm tra cần số ở vị trí P hoặc N. - Đạp hết hành trình bàn đạp phanh, vặn chìa khóa đến vị trí (START) để khởi động động cơ"
);
const driverSeatingEvidence = drivingTechniqueEvidence(
  "Mục 2.4.1, Điều chỉnh ghế ngồi lái xe",
  "Người lái xe thực hiện điều chỉnh chiều cao ghế ngồi sao cho đùi và cẳng chân tạo thành một góc 120°; điều chỉnh tựa lưng ghế ngả ra sau khoảng 20° so với phương thẳng đứng; điều chỉnh tiến, lùi ghế để cẳng tay và bắp tay tạo thành một góc 120° đồng thời chân đạp hết hành trình các bàn đạp ly hợp, phanh và ga mà đầu gối vẫn còn hơi chùng; hai tay cầm hai bên vành vô lăng lái mắt nhìn thẳng về phía trước."
);
const trenchCrossingEvidence = drivingTechniqueEvidence(
  "Mục 3.4.1, Lái xe trên đường gồ ghề",
  "Khi vượt qua rãnh lớn cắt ngang mặt đường, phải gài số 1 và từ từ cho 2 bánh trước xuống rãnh, tăng ga cho 2 bánh trước vượt lên khỏi rãnh, tiếp tục để bánh sau từ từ xuống rãnh rồi tăng ga dần cho xe ô tô lên khỏi rãnh."
);
const gearChangeEvidence = drivingTechniqueEvidence(
  "Mục 2.9.1, Điều khiển cần số; mục 2.12.1–2.12.2, Tăng và giảm số",
  "Yêu cầu: Mắt nhìn thẳng. Thao tác nhanh, dứt khoát, khi xong đưa tay về nắm vào vành vô lăng lái. Chú ý: Khi giảm số chủ động thì giảm tuần tự từ cao xuống thấp, khi giảm số bị động có thể giảm tắt số mà không cần tuần tự. Cần tăng số theo thứ tự từ thấp đến cao. Cần giảm số theo thứ tự từ số cao đến số thấp."
);
const dashboardWarningEvidence = (citation, quote) => drivingTechniqueEvidence(citation, quote);
const parkingBrakeDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Khi người lái xe sử dụng phanh đỗ, đèn báo hiệu phanh đỗ trên bảng đồng hồ sẽ bật sáng."
);
const oilPressureDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn báo dầu máy (hình 1-18b): nếu sáng báo hiệu tình trạng dầu bôi trơn có vấn đề."
);
const doorDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn cửa xe (hình 1-18c): nếu sáng báo hiệu cửa xe đóng chưa chặt."
);
const engineDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn báo kiểm tra động cơ (hình 1-18e): nếu sáng báo hiệu động cơ đang gặp trục trặc."
);
const tirePressureDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn báo hiệu áp suất lốp (hình 1-18f): Nếu sáng báo hiệu áp suất lốp không đạt theo tiêu chuẩn."
);
const coolantDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn báo hiệu nhiệt độ nước quá cao (hình 1-18g): Nếu sáng báo hiệu nhiệt độ nước làm mát động cơ cao quá ngưỡng quy định."
);
const absDashboardEvidence = dashboardWarningEvidence(
  "Mục 1.3.2, Các loại đồng hồ và đèn báo trong bảng đồng hồ",
  "Đèn báo hiệu hệ thống chống bó cứng khi phanh ABS (hình 1-18h): Nếu đèn sáng, hệ thống phanh đang gặp vấn đề."
);
const parkingBrakeReleaseEvidence = drivingTechniqueEvidence(
  "Hình 1-15, Cần, nút bấm điều khiển phanh đỗ",
  "Khi không sử dụng phanh đỗ người lái bấm nút ở đầu cần và hạ cần xuống."
);
const manualTransmissionStartEvidence = drivingTechniqueEvidence(
  "Mục 2.11.1, Phương pháp khởi hành (đường bằng)",
  "Đạp bàn đạp ly hợp hết hành trình."
);
const firstGearStartEvidence = drivingTechniqueEvidence(
  "Mục 2.11.1, Phương pháp khởi hành (đường bằng)",
  "Để chuyển từ số “0” sang số “1”, người lái xe kéo nhẹ cần số về phía cửa số “1” rồi đẩy vào số “1”."
);
const releaseHandbrakeStartEvidence = drivingTechniqueEvidence(
  "Mục 2.11.1, Phương pháp khởi hành (đường bằng)",
  "Nhả phanh tay: bấm nút 1 để mở khóa, hạ cần 2 xuống."
);
const steeringWheelPostureEvidence = drivingTechniqueEvidence(
  "Mục 3.10.1, Lái xe trên đường cao tốc",
  "Tư thế ngồi lái thoải mái, hai tay nắm vô lăng lái ở vị trí 10 giờ, 2 giờ và không quên cài dây an toàn."
);
const automaticPedalUseEvidence = drivingTechniqueEvidence(
  "Mục 1.3.7, Bàn đạp ga",
  "Người lái xe chỉ sử dụng chân phải để điều khiển."
);
const dipstickCheckEvidence = drivingTechniqueEvidence(
  "Mục 2.10.1, Kiểm tra trước khi khởi động động cơ",
  "Kiểm tra mức dầu bôi trơn trong máng dầu (các te dầu) của động cơ bằng thước thăm dầu, nếu thiếu thì bổ sung đủ mức quy định;"
);
const clutchFunctionEvidence = drivingTechniqueEvidence(
  "Mục 1.3.5, Bàn đạp ly hợp, phanh, ga",
  "Bàn đạp ly hợp để đóng, mở ly hợp nhằm nối hoặc ngắt động lực từ động cơ đến hệ thống truyền lực."
);
const steeringFunctionEvidence = drivingTechniqueEvidence(
  "Mục 1.3.1, Vô lăng lái",
  "Vô lăng lái dùng để điều khiển hướng chuyển động của xe ôtô."
);
const brakeFunctionEvidence = drivingTechniqueEvidence(
  "Mục 1.3.5, Bàn đạp ly hợp, phanh, ga",
  "Bàn đạp phanh để điều khiển sự hoạt động của hệ thống phanh nhằm giảm tốc độ, hoặc dừng hẳn sự chuyển động của ôtô trong những trường hợp cần thiết."
);
const gearboxFunctionEvidence = drivingTechniqueEvidence(
  "Mục 2.9, Điều khiển cần số",
  "Khi điều khiển cần số sẽ làm thay đổi sự ăn khớp giữa các cặp bánh răng trong hộp số, làm thay đổi sức kéo và tốc độ chuyển động của xe ôtô."
);
const vehicleStructureEvidence = (citation, quote) => ({
  title: "Giáo trình Cấu tạo và sửa chữa thông thường xe ô tô (Tổng cục Đường bộ Việt Nam, 2017)",
  citation,
  url: vehicleStructureManualUrl,
  quote
});
const maintenancePurposeEvidence = vehicleStructureEvidence(
  "Mục 8.1, Mục đích, tính chất của bảo dưỡng kỹ thuật xe ô tô",
  "Bảo dưỡng kỹ thuật xe ôtô nhằm mục đích duy trì tình trạng kỹ thuật luôn luôn tốt, giảm cường độ hao mòn các chi tiết, ngăn ngừa và phát hiện kịp thời hư hỏng của các cụm, tổng thành, hệ thống ..., để có biện pháp khắc phục kịp thời."
);
const fourStrokeEngineEvidence = vehicleStructureEvidence(
  "Mục 2.3, Động cơ đốt trong 4 kỳ nhiều xi lanh sử dụng trên xe ô tô",
  "Pít tông phải thực hiện 4 hành trình ứng với hai vòng quay của trục khuỷu. Trong bốn hành trình chỉ có một hành trình sinh công."
);
const lubricationSystemEvidence = vehicleStructureEvidence(
  "Mục 2.4, Hệ thống bôi trơn động cơ",
  "Hệ thống bôi trơn động cơ dùng để: Đưa dầu tới các bề mặt ma sát để bôi trơn; Lọc sạch tạp chất lẫn trong dầu nhờn khi dầu nhờn tẩy rửa các bề mặt ma sát; Làm mát các bề mặt ma sát và làm mát dầu bôi trơn."
);
const engineFunctionEvidence = vehicleStructureEvidence(
  "Mục 2.1, Công dụng và cấu tạo chung của động cơ ô tô",
  "Động cơ là nguồn động lực của ôtô. Khi làm việc, nhiệt năng được biến đổi thành cơ năng và truyền đến các bánh xe chủ động tạo ra chuyển động tịnh tiến cho ôtô."
);
const transmissionFunctionEvidence = vehicleStructureEvidence(
  "Mục 3.1, Hệ thống truyền lực",
  "Hệ thống truyền lực dùng để truyền mô men xoắn từ động cơ tới các bánh xe chủ động của ôtô."
);
const batteryFunctionEvidence = vehicleStructureEvidence(
  "Mục 4.2.1, Ắc quy",
  "Ắc quy để tích trữ điện năng, cung cấp cho các phụ tải như: Máy khởi động để khởi động động cơ, Các phụ tải khác khi máy phát chưa làm việc, hoặc tốc độ quay của máy phát chưa đạt định mức."
);
const alternatorFunctionEvidence = vehicleStructureEvidence(
  "Mục 4.2.2, Máy phát điện",
  "Máy phát điện để phát ra điện năng cung cấp cho các phụ tải và nạp điện cho ắc quy ở những chế độ làm việc nhất định của động cơ."
);
const seatbeltFunctionEvidence = vehicleStructureEvidence(
  "Mục 5.1.1, Dây đai an toàn",
  "Dây đai có nhiệm vụ giữ chặt người lái và hành khách trên ghế ngồi không cho người bay về trước và đập vào kính chắn gió hoặc va đập vào bảng đồng hồ khi chiếc xe đột ngột dừng lại."
);
const airbagFunctionEvidence = vehicleStructureEvidence(
  "Mục 5.2.1, Hệ thống túi khí",
  "Túi khí giúp giảm hơn nữa khả năng va đập của mặt và đầu với các vật thể trong xe và hấp thụ một phần lực va đập lên người lái và hành khách."
);
const seatbeltWarningEvidence = vehicleStructureEvidence(
  "Chương 6, Hình 5.1, bảng tín hiệu cảnh báo trên ô tô, mục 30",
  "Đèn báo không thắt dây an toàn — Cài dây an toàn."
);
const lowFuelWarningEvidence = vehicleStructureEvidence(
  "Chương 6, Hình 5.1, bảng tín hiệu cảnh báo trên ô tô, mục 53",
  "Đèn báo xe sắp hết nhiên liệu — Cần bổ sung nhiên liệu."
);
const steeringAssistWarningEvidence = vehicleStructureEvidence(
  "Chương 6, Hình 5.1, bảng tín hiệu cảnh báo trên ô tô, mục 2",
  "Đèn cảnh báo trợ lực lái điện — Cần sửa chữa."
);
const jackToolEvidence = vehicleStructureEvidence(
  "Mục 7.3.3, Thay bánh xe",
  "Bước 3: kích xe."
);
const ecoModeWarningEvidence = vehicleStructureEvidence(
  "Chương 6, Hình 5.1, bảng tín hiệu cảnh báo trên ô tô, mục 46",
  "Đèn báo chế độ lái tiết kiệm nhiên liệu — Báo hiệu."
);
const laneRuleEvidence = {
  title: "Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15",
  citation: "Khoản 1 Điều 10",
  url: trafficLawUrl,
  quote: "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."
};
const wrongWaySignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.2, biển số P.102",
  url: qcvn41Url,
  quote: "a) Để báo đường cấm các loại xe (cơ giới và thô sơ) đi vào theo chiều đặt biển, trừ các xe được ưu tiên theo quy định, đặt biển số P.102 \"Cấm đi ngược chiều\". Người đi bộ được phép đi trên vỉa hè hoặc lề đường."
};
const closedRoadSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.1, biển số P.101",
  url: qcvn41Url,
  quote: "a) Để báo đường cấm các loại phương tiện đi lại cả hai hướng, trừ các xe được ưu tiên theo quy định, đặt biển số P.101 “Đường cấm”."
};
const stopSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục D.2, biển số R.122",
  url: qcvn41Url,
  quote: "Biển có hiệu lực buộc các loại xe cơ giới và thô sơ kể cả xe được ưu tiên theo quy định dừng lại trước biển hoặc trước vạch ngang đường và chỉ được phép đi khi thấy các tín hiệu (do người điều khiển giao thông hoặc đèn cờ) cho phép đi."
};
const mirrorRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm C.2.1 Phụ lục C",
  url: qcvn09Url,
  quote: "Thiết bị quan sát gián tiếp chính phải được lắp ở vị trí để người lái xe nhìn, quan sát hoặc nhận biết được rõ ràng đường hai bên về phía sau xe."
};
const carLightingRequirementsEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.22.1",
  url: qcvn09Url,
  quote: "Xe phải trang bị các loại đèn chiếu sáng và tín hiệu sau đây: đèn chiếu sáng phía trước gồm có đèn chiếu xa (đèn pha) và đèn chiếu gần (đèn cốt), đèn báo rẽ, đèn cảnh báo nguy hiểm, đèn vị trí, đèn phanh, đèn lùi, đèn soi biển số sau."
};
const windshieldRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.20",
  url: qcvn09Url,
  quote: "Kính trên xe phải là kính an toàn, riêng kính chắn gió phải là kính an toàn nhiều lớp. Kính cửa của xe phải là kính an toàn. Kính sử dụng là cửa sổ thoát hiểm khẩn cấp, cửa thoát hiểm khẩn cấp phải là kính an toàn có độ bền cao."
};
const tireRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.3.1–2.3.2",
  url: qcvn09Url,
  quote: "Có kết cấu chắc chắn, lắp đặt đúng quy cách. Lốp trên cùng một trục của xe sử dụng trong điều kiện hoạt động bình thường phải cùng kiểu loại. Lốp phải đủ số lượng, đủ áp suất, thông số kỹ thuật của lốp (cỡ lốp, cấp tốc độ hoặc vận tốc, chỉ số về tải trọng hoặc khả năng chịu tải trọng của lốp) phải phù hợp với tài liệu kỹ thuật, thiết kế của xe. Lốp sử dụng cho từng loại xe phải phù hợp với các quy định tại QCVN 34:2024/BGTVT (Quy chuẩn kỹ thuật quốc gia về lốp hơi dùng cho ô tô) hoặc quy định UNECE No.30 (Uniform provisions concerning the approval of pneumatic tyres for Motor vehicle and their trailer) hoặc quy định UNECE No.54 (Uniform provisions concerning the approval of pneumatic tyres for commercial vehicles and their trailers) phiên bản tham chiếu hoặc mới hơn."
};
const steeringRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.4.1–2.4.3",
  url: qcvn09Url,
  quote: "Đảm bảo cho xe chuyển hướng chính xác, điều khiển nhẹ nhàng, an toàn ở mọi vận tốc và tải trọng trong phạm vi tính năng kỹ thuật cho phép của xe. Các bánh xe dẫn hướng phải đảm bảo cho xe có khả năng duy trì hướng chuyển động thẳng khi đang chạy thẳng và tự quay về hướng chuyển động thẳng khi thôi tác dụng lực lên vành tay lái (khi thôi quay vòng). Khi hoạt động các cơ cấu chuyển động của hệ thống lái không được va quệt với bất kỳ bộ phận nào của xe như khung, vỏ."
};
const seatBeltRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.16.1–2.16.4",
  url: qcvn09Url,
  quote: "Ghế lái của tất cả loại xe phải được trang bị dây đai an toàn loại ba điểm trở lên. Ghế khách phía ngoài cùng thuộc hàng ghế đầu tiên, cùng với dãy ghế người lái (trừ xe ô tô khách thành phố) phải được trang bị dây đai an toàn loại ba điểm trở lên. Các ghế nằm giữa ghế lái và ghế ngoài cùng của hàng ghế này phải được trang bị dây đai an toàn tối thiểu loại hai điểm. Ghế khách không thuộc hàng ghế đầu tiên cùng với hàng ghế người lái xe của các xe (trừ xe ô tô khách thành phố), giường nằm phải được trang bị dây đai an toàn tối thiểu loại hai điểm. Đai an toàn phải được lắp đặt phù hợp tại từng vị trí ngồi hoặc nằm, đảm bảo hoạt động bình thường và giảm thiểu rủi ro gây thương tích cho người sử dụng khi xảy ra tai nạn. Các dây đai an toàn không được có kết cấu dễ gây nguy hiểm cho người sử dụng. Các bộ phận cứng trong dây đai an toàn như khóa, bộ phận điều chỉnh, không được có cạnh sắc gây ra mài mòn hoặc đứt dây đai do cọ xát; Khóa phải được thiết kế sao cho loại trừ được các khả năng sử dụng không đúng như không thể đóng ở trạng thái nửa chừng. Cách mở khóa phải dứt khoát; Bộ phận điều chỉnh đai phải tự động điều chỉnh để dây đai ôm vừa khít với người sử dụng hoặc nếu dùng bộ phận điều chỉnh bằng tay thì người sử dụng phải dễ dàng điều chỉnh khi đã ngồi vào ghế; Dây đai không bị xoắn ngay cả khi bị kéo căng và phải có khả năng hấp thụ, phân tán năng lượng; Chiều rộng của dây đai không được nhỏ hơn 46 mm; Các điểm neo giữ đai phải được lắp đặt chắc chắn, phù hợp với loại đai an toàn và vị trí sử dụng."
};
const exhaustRequirementEvidence = {
  title: "QCVN 09:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe ô tô",
  citation: "Điểm 2.21.1–2.21.2",
  url: qcvn09Url,
  quote: "Miệng thoát khí thải của ống xả không được hướng về phía trước và không được hướng về phía bên phải theo chiều tiến của xe. Ống xả không được đặt ở vị trí có thể gây cháy xe hoặc hàng hóa trên xe và gây cản trở hoạt động của hệ thống khác."
};
const vehicleAgeEvidence = {
  title: "Nghị định số 89/2026/NĐ-CP quy định về điều kiện kinh doanh dịch vụ kiểm định xe cơ giới; tổ chức, hoạt động của cơ sở đăng kiểm; niên hạn sử dụng của xe cơ giới",
  citation: "Khoản 1 và khoản 2 Điều 18",
  url: vehicleAgeDecreeUrl,
  quote: "1. Hai mươi lăm (25) năm tính từ năm sản xuất đối với xe ô tô chở hàng (xe ô tô tải), xe ô tô chở hàng chuyên dùng (xe ô tô tải chuyên dùng).\n2. Hai mươi (20) năm tính từ năm sản xuất đối với xe ô tô chở người có số người cho phép chở từ 09 người trở lên (không kể người lái xe), xe ô tô chở trẻ em mầm non, xe ô tô chở học sinh, xe chở hàng bốn bánh có gắn động cơ."
};
const motorcycleBrakeLightEvidence = {
  title: "QCVN 14:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về chất lượng an toàn kỹ thuật và bảo vệ môi trường đối với xe mô tô, xe gắn máy",
  citation: "Điểm 2.8.6.1–2.8.6.4",
  url: qcvn14Url,
  quote: "Phải có ít nhất một đèn. Đối với xe có chiều rộng lớn hơn 1300 mm, phải có ít nhất hai đèn; riêng với xe có thùng bên, phải có thêm một đèn ở phía sau thùng. Đèn phải có ánh sáng màu đỏ. Phải nhận biết được ánh sáng của đèn vào ban ngày ở khoảng cách tối thiểu 30 m từ phía sau hoặc cường độ sáng của đèn phải từ 40 cd đến 260 cd. Đèn phải sáng khi hệ thống phanh chính hoạt động."
};
const vehicleFireSafetyEvidence = {
  title: "Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15",
  citation: "Điểm d khoản 4 Điều 8",
  url: fireSafetyLawUrl,
  quote: "Trang bị, duy trì tính năng sử dụng của phương tiện phòng cháy, chữa cháy, cứu nạn, cứu hộ; tổ chức chữa cháy, cứu nạn, cứu hộ; khắc phục hậu quả do cháy, tai nạn, sự cố gây ra;"
};
const fireResponseEvidence = {
  title: "Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15",
  citation: "Khoản 1 Điều 25",
  url: fireSafetyLawUrl,
  quote: "Người phát hiện cháy, cơ quan, tổ chức, hộ gia đình, cá nhân gần nơi xảy ra cháy có trách nhiệm tham gia chữa cháy trong điều kiện, khả năng cho phép."
};
const trafficSignalEvidence = {
  title: qcvn41Title,
  citation: "Mục 6.3.1–6.3.3 và 6.4.1–6.4.4",
  url: qcvn41Url,
  quote: "6.3.1. Tín hiệu xanh: tín hiệu đèn màu xanh là được đi; trường hợp người đi bộ, xe lăn của người khuyết tật đang đi ở lòng đường, người điều khiển phương tiện tham gia giao thông đường bộ phải giảm tốc độ hoặc dừng lại nhường đường cho người đi bộ, xe lăn của người khuyết tật qua đường; 6.3.2. Tín hiệu đèn màu vàng phải dừng lại trước vạch dừng; trường hợp đang đi trên vạch dừng hoặc đã đi qua vạch dừng mà tín hiệu đèn màu vàng thì được đi tiếp. Trường hợp tín hiệu đèn màu vàng nhấp nháy, người điều khiển phương tiện tham gia giao thông đường bộ được đi nhưng phải quan sát, giảm tốc độ hoặc dừng lại nhường đường cho người đi bộ, xe lăn của người khuyết tật qua đường hoặc các phương tiện khác. 6.3.3. Tín hiệu đèn màu đỏ là cấm đi: báo hiệu phải dừng lại trước vạch dừng. 6.4.1. Nếu đèn có lắp đèn hình mũi tên màu xanh thì các loại phương tiện giao thông chỉ được đi khi tín hiệu mũi tên bật sáng cho phép. Tín hiệu mũi tên cho phép rẽ trái thì đồng thời cho phép quay đầu nếu không có báo hiệu cấm quay đầu khác. 6.4.3. Khi tín hiệu mũi tên màu xanh được bật sáng cùng một lúc với tín hiệu đỏ hoặc vàng thì các phương tiện đi theo hướng mũi tên nhưng phải nhường đường cho các loại phương tiện đi từ các hướng khác đang được phép đi. 6.4.4. Khi tín hiệu mũi tên màu đỏ được bật sáng cùng lúc với tín hiệu đèn chính màu xanh thì phương tiện không được đi theo hướng mũi tên."
};
const mandatoryDirectionSignEvidence = {
  title: qcvn41Title,
  citation: "Điều 32.1 và Điều 34.2",
  url: qcvn41Url,
  quote: "- Biển số R.301(a,b,c,d,e,f,g,h): Hướng đi phải theo; - Biển số R.411: Hướng đi trên mỗi làn đường phải theo. Các biển hiệu lệnh có hiệu lực kể từ vị trí đặt biển."
};
const prohibitedVehicleSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.3–B.6, biển số P.103–P.106",
  url: qcvn41Url,
  quote: "a) Để báo đường cấm các loại xe cơ giới kể cả xe máy 3 bánh có thùng đi qua, trừ xe máy 2 bánh, xe gắn máy và các xe được ưu tiên theo quy định, đặt biển số P.103a “Cấm xe ôtô”\nb) Để báo đường cấm các loại xe cơ giới kể cả xe máy 3 bánh có thùng rẽ phải hay rẽ trái, trừ xe máy 2 bánh, xe gắn máy và các xe được ưu tiên theo quy định, đặt biển số P.103b “Cấm xe ô tô rẽ phải” hay biển số P.103c “Cấm xe ô tô rẽ trái”.\nĐể báo đường cấm các loại xe máy, trừ các xe được ưu tiên theo quy định, đặt biển số P.104 “Cấm xe máy”. Biển không có giá trị cấm những người dắt xe máy.\nĐể báo đường cấm các loại xe cơ giới và xe máy đi qua trừ các xe được ưu tiên theo quy định, đặt biển số P.105 “Cấm xe ô tô và xe máy”.\na) Để báo đường cấm các loại xe ô tô tải trừ các xe được ưu tiên theo quy định, đặt biển số P.106a “Cấm xe ô tô tải”. Biển có hiệu lực cấm đối với cả máy kéo và các xe máy chuyên dùng đi vào đoạn đường đặt biển số P.106a.\nb) Để báo đường cấm các loại xe ô tô tải có khối lượng chuyên chở (theo Giấy chứng nhận kiểm định an toàn kỹ thuật và bảo vệ môi trường phương tiện giao thông cơ giới đường bộ) lớn hơn một giá trị nhất định, đặt biển số P.106b. Biển có hiệu lực cấm các xe ô tô tải có khối lượng chuyên chở (xác định theo Giấy chứng nhận kiểm định an toàn kỹ thuật và bảo vệ môi trường phương tiện giao thông cơ giới đường bộ) lớn hơn giá trị chữ số ghi trong biển (chữ số tấn ghi bằng màu trắng trên hình vẽ xe). Biển có hiệu lực cấm đối với cả máy kéo và các xe máy chuyên dùng đi vào đoạn đường đặt biển.\nc) Để báo đường cấm các xe chở hàng nguy hiểm, đặt biển số P.106c."
};
const vehicleClassSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.7b–B.14, biển số P.107b–P.114",
  url: qcvn41Url,
  quote: "Để báo đường cấm xe ô tô taxi đi lại, đặt biển số P.107b “Cấm xe ô tô taxi”. Trường hợp cấm xe ô tô taxi theo giờ thì đặt biển phụ ghi giờ cấm.\nĐể báo đường cấm các loại xe cơ giới kéo theo rơ-moóc kể cả xe máy, máy kéo, ô tô khách kéo theo rơ-moóc đi lại, trừ loại ôtô sơ-mi rơ-moóc và các xe được ưu tiên (có kéo theo rơ-moóc) theo quy định, đặt biển số P.108 “Cấm xe ô tô, máy kéo kéo rơ-moóc”.\nĐể báo đường cấm các loại xe sơ-mi rơ-moóc và các xe kéo rơ-moóc trừ các xe được ưu tiên (có dạng xe sơ-mi rơ-moóc hoặc có kéo theo rơ-moóc) theo quy định, đặt biển số P.108a “Cấm xe sơ-mi rơ-moóc”.\nĐể báo đường cấm các loại máy kéo, kể cả máy kéo bánh hơi và bánh xích đi qua, đặt biển số P.109 “Cấm máy kéo”.\na) Để báo đường cấm xe gắn máy đi qua, đặt biển số P.111a “Cấm xe gắn máy”. Biển không có giá trị đối với xe đạp.\nb) Để báo đường cấm xe ba bánh loại có động cơ như xe lam, xe xích lô máy, xe lôi máy, v.v... đặt biển số P.111b hoặc P.111c “Cấm xe ba bánh loại có động cơ”.\nc) Để báo đường cấm xe ba bánh loại không có động cơ như xe xích lô, xe lôi đạp, v.v... đặt biển số P.111d “Cấm xe ba bánh loại không có động cơ”.\nĐể báo đường cấm xe thô sơ, chuyển động do người kéo, đẩy đi qua, đặt biển số P.113 “Cấm xe người kéo, đẩy”. Biển không có giá trị cấm những xe nôi của trẻ em và phương tiện chuyên dùng để đi lại của những người khuyết tật.\nĐể báo đường cấm súc vật vận tải hàng hóa hoặc hành khách dù kéo xe hay chở trên lưng đi qua, đặt biển số P.114 “Cấm xe vật nuôi kéo”."
};
const turnaroundAndTurnSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.23–B.24, biển số P.123–P.124",
  url: qcvn41Url,
  quote: "a) Để báo cấm rẽ trái hoặc rẽ phải (theo hướng mũi tên chỉ) ở những vị trí đường giao nhau, đặt biển số P.123a “Cấm rẽ trái” hoặc biển số P.123b “Cấm rẽ phải”. Biển không có giá trị cấm quay đầu xe.\nb) Biển có hiệu lực cấm các loại xe (cơ giới và thô sơ) rẽ sang phía trái hoặc phía phải trừ các xe được ưu tiên theo quy định.\na) Để báo cấm các loại xe quay đầu (theo kiểu chữ U), đặt biển số P.124a “Cấm quay đầu xe”. Chiều mũi tên phù hợp với chiều cấm quay đầu xe.\nb) Để báo cấm xe ô tô quay đầu (theo kiểu chữ U), đặt biển số P.124b “Cấm ô tô quay đầu xe”. Chiều mũi tên phù hợp với chiều cấm xe ô tô quay đầu.\nc) Để báo cấm các loại xe rẽ trái đồng thời cấm quay đầu, đặt biển số P.124c “Cấm rẽ trái và quay đầu xe”.\nd) Để báo cấm các loại xe rẽ phải đồng thời cấm quay đầu, đặt biển số P.124d “Cấm rẽ phải và quay đầu xe”.\ne) Để báo cấm xe ô tô rẽ trái và đồng thời cấm quay đầu, đặt biển số P.124e “Cấm ô tô rẽ trái và quay đầu xe”.\nf) Để báo cấm xe ô tô rẽ phải và đồng thời cấm quay đầu, đặt biển số P.124f “Cấm ô tô rẽ phải và quay đầu xe”.\ng) Biển số P.124a có hiệu lực cấm các loại xe (cơ giới và thô sơ) và biển số P.124b có hiệu lực cấm xe ô tô và xe máy 3 bánh (side car) quay đầu (theo kiểu chữ U) trừ các xe được ưu tiên theo quy định. Biển không có giá trị cấm rẽ trái để đi sang hướng đường khác."
};
const overtakingAndSpeedSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.25–B.27a, biển số P.125–P.127a",
  url: qcvn41Url,
  quote: "a) Để báo cấm các loại xe cơ giới vượt nhau, đặt biển số P.125 “Cấm vượt”.\nb) Biển có hiệu lực cấm tất cả các loại xe cơ giới vượt nhau (kể cả xe được ưu tiên theo quy định) nhưng được phép vượt xe máy 2 bánh, xe gắn máy.\na) Để báo cấm các loại ô tô tải vượt xe cơ giới khác, đặt biển số P.126 “Cấm xe ô tô tải vượt”.\nb) Biển có hiệu lực cấm các loại ô tô tải có khối lượng chuyên chở (theo Giấy chứng nhận kiểm định an toàn kỹ thuật và bảo vệ môi trường phương tiện giao thông cơ giới đường bộ) lớn hơn 3.500 kg kể cả các xe được ưu tiên theo quy định vượt xe cơ giới khác. Được phép vượt xe máy 2 bánh, xe gắn máy.\nKhi cần quy định tốc độ tối đa về ban đêm cho các phương tiện, đặt biển số P.127a “Tốc độ tối đa cho phép về ban đêm”. Biển chỉ có hiệu lực trong thời gian ghi trên biển và trong phạm vi từ vị trí đặt biển đến vị trí biển số R.421 “Hết khu đông dân cư”. Số ghi trên biển tốc độ tối đa cho phép lớn nhất về ban đêm tính bằng km/h và không lớn hơn 80 km/h. Người tham gia giao thông về ban đêm không được vượt quá giá trị tốc độ ghi trên biển trừ một số trường hợp ưu tiên được quy định."
};
const loadLimitSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.15–B.17, biển số P.115–P.117",
  url: qcvn41Url,
  quote: "Để báo đường cấm các xe (cơ giới và thô sơ) kể cả các xe được ưu tiên theo quy định, có trọng tải toàn bộ xe (trọng tải bản thân xe cộng với khối lượng người, hành lý và hàng hóa xếp trên xe) vượt quá trị số ghi trên biển đi qua, đặt biển số P.115 “Hạn chế trọng tải toàn bộ xe”.\nĐể báo đường cấm các xe (cơ giới và thô sơ) kể cả các xe được ưu tiên theo quy định, có trọng tải toàn bộ xe (cả xe và hàng) phân bổ trên một trục bất kỳ của xe (tải trọng trục xe) vượt quá trị số ghi trên biển đi qua, đặt biển số P.116 “Hạn chế tải trọng trên trục xe”.\na) Để báo hạn chế chiều cao của xe, đặt biển số P.117 “Hạn chế chiều cao”.\nb) Biển số P.117 có hiệu lực cấm các xe (cơ giới và thô sơ) có chiều cao vượt quá trị số ghi trên biển đi qua, kể cả các xe được ưu tiên theo quy định (chiều cao tính từ mặt đường, mặt cầu đến điểm cao nhất của xe hoặc hàng)."
};
const parkingSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.30–B.31, biển số P.130–P.131",
  url: qcvn41Url,
  quote: "a) Để báo nơi cấm dừng xe và đỗ xe, đặt biển số P.130 “Cấm dừng xe và đỗ xe”. Biển có hiệu lực cấm các loại xe cơ giới dừng và đỗ ở phía đường có đặt biển trừ các xe được ưu tiên theo quy định.\nBiển số P.131a có hiệu lực cấm các loại xe cơ giới đỗ ở phía đường có đặt biển. Biển số P.131b có hiệu lực cấm các loại xe cơ giới đỗ ở phía đường có đặt biển vào những ngày lẻ và biển số P.131c vào những ngày chẵn."
};
const hornAndTurnSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.28, biển số P.128 và biển số S.501",
  url: qcvn41Url,
  quote: "a) Để báo cấm các loại xe sử dụng còi, đặt biển số P.128 “Cấm sử dụng còi”.\nb) Chiều dài có hiệu lực của biển cấm sử dụng còi được báo bằng biển số S.501 “Phạm vi tác dụng của biển” đặt dưới biển chính (hoặc từ vị trí đặt biển đến vị trí đặt biển số DP.135 “Hết tất cả các lệnh cấm” nếu đồng thời có nhiều biển cấm khác hết tác dụng)."
};
const noLeftRightSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.37, biển số P.137",
  url: qcvn41Url,
  quote: "Các ngả đường phía trước cấm tất cả các loại xe (trừ xe ưu tiên theo qui định) rẽ trái hay rẽ phải, đặt biển số P.137 “Cấm rẽ trái, rẽ phải”. Biển được đặt ở vị trí ngay trước nút giao của đường cấm rẽ phải, rẽ trái."
};
const distanceAndLengthSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.18–B.21, biển số P.118–P.121",
  url: qcvn41Url,
  quote: "a) Để báo hạn chế chiều ngang của xe, đặt biển số P.118 “Hạn chế chiều ngang xe”. Biển số P.118 có hiệu lực cấm các xe (cơ giới và thô sơ) kể cả các xe được ưu tiên theo quy định có chiều ngang (kể cả xe và hàng hóa) vượt quá trị số ghi trên biển đi qua.\na) Để báo đường cấm các loại xe (cơ giới và thô sơ) kể cả các xe được ưu tiên theo quy định, có độ dài toàn bộ kể cả xe và hàng lớn hơn trị số ghi trên biển đi qua, đặt biển số P.119 “Hạn chế chiều dài xe”.\na) Để báo đường cấm các loại xe cơ giới kéo theo moóc kể cả ô tô sơ-mi-rơ-moóc và các loại xe được ưu tiên kéo moóc theo quy định, có độ dài toàn bộ kể cả xe, moóc và hàng lớn hơn trị số ghi trên biển đi qua, đặt biển số P.120 “Hạn chế chiều dài xe cơ giới kéo theo rơ-moóc hoặc sơ-mi rơ moóc”.\na) Để báo xe ô tô phải đi cách nhau một khoảng tối thiểu, đặt biển số P.121 “Cự ly tối thiểu giữa hai xe”.\nb) Số ghi trên biển cho biết khoảng cách tối thiểu tính bằng mét. Biển có hiệu lực cấm các xe ô tô kể cả xe được ưu tiên theo quy định đi cách nhau một cự ly nhỏ hơn trị số ghi trên biển báo."
};
const passengerAndNightSpeedSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.7a và B.27a, biển số P.107a và P.127a",
  url: qcvn41Url,
  quote: "a) Để báo đường cấm ô tô chở khách đi qua trừ các xe ưu tiên theo quy định, đặt biển số P.107a “Cấm xe ô tô khách”. Biển này không cấm xe buýt.\nKhi cần quy định tốc độ tối đa về ban đêm cho các phương tiện, đặt biển số P.127a “Tốc độ tối đa cho phép về ban đêm”. Biển chỉ có hiệu lực trong thời gian ghi trên biển và trong phạm vi từ vị trí đặt biển đến vị trí biển số R.421 “Hết khu đông dân cư”. Số ghi trên biển tốc độ tối đa cho phép lớn nhất về ban đêm tính bằng km/h và không lớn hơn 80 km/h. Người tham gia giao thông về ban đêm không được vượt quá giá trị tốc độ ghi trên biển trừ một số trường hợp ưu tiên được quy định."
};
const speedLimitSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.27, biển số P.127",
  url: qcvn41Url,
  quote: "a) Để báo tốc độ tối đa cho phép các xe cơ giới chạy, đặt biển số P.127 “Tốc độ tối đa cho phép”; b) Biển có hiệu lực cấm các loại xe cơ giới chạy với tốc độ tối đa vượt quá trị số ghi trên biển trừ các xe được ưu tiên theo quy định."
};
const laneSpeedSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.27e, biển số P.127c",
  url: qcvn41Url,
  quote: "a) Khi quy định tốc độ tối đa cho phép theo phương tiện trên từng làn đường, sử dụng biển số P.127c. Các loại phương tiện phải đi đúng làn đường và tuân thủ tốc độ tối đa cho phép trên làn đường đó."
};
const areaEndSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục D.20, biển số R.E.10b và R.E.10d",
  url: qcvn41Url,
  quote: "Để báo hiệu hết cấm đỗ xe theo giờ trong khu vực, đặt biển số R.E,10b “Hết cấm đỗ xe theo giờ trong khu vực”;\nĐể quy định hết hạn chế tốc độ tối đa trong khu vực, đặt biển số R.E,10d “Hết hạn chế tốc độ tối đa trong khu vực”."
};
const administrativeBoundarySignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.19, biển số I.419",
  url: qcvn41Url,
  quote: "a) Để chỉ dẫn địa giới hành chính giữa các thành phố, tỉnh, huyện, đặt biển số I.419(a,b) “Chỉ dẫn địa giới”. Biển số I.419b áp dụng cho các tuyến đường đối ngoại và các tuyến đường có nhiều người nước ngoài đi lại. Biển số I.419a áp dụng cho các trường hợp khác."
};
const roadNameSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.52, biển số I.449",
  url: qcvn41Url,
  quote: "Để báo tên đường cho các tuyến đường đối ngoại, sử dụng biển số I.449 “Biển tên đường”."
};
const restAreaServiceSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.33, biển số I.431",
  url: qcvn41Url,
  quote: "Để chỉ dẫn những nơi có các dịch vụ phục vụ khách đi đường (ăn uống nghỉ ngơi, cung cấp nhiên liệu...), đặt biển số I.431 “Trạm dừng nghỉ”. Tùy trạm dừng nghỉ có dịch vụ gì mà bố trí các biểu tượng hình vẽ cho phù hợp."
};
const laneMergeSignEvidence = {
  title: qcvn41Title,
  citation: "Phần 46.1, biển số IE.467a–IE.467b",
  url: qcvn41Url,
  quote: "Biển số IE.467a chỉ dẫn vị trí nhập làn xe tại các vị trí nút giao thông có lưu lượng xe lớn. Để chỉ dẫn cho người điều khiển phương tiện giao thông biết trước sắp đến vị trí nhập làn xe (Biển số IE.467b). Biển được đặt bên lề đường gần vị trí nút giao."
};
const expresswayEndSignEvidence = {
  title: qcvn41Title,
  citation: "Phần 47.4.2, biển số IE.453c",
  url: qcvn41Url,
  quote: "Để chỉ dẫn hết đường cao tốc, đặt biển số IE.453c “Hết đường cao tốc”."
};
const weightControlSignEvidence = {
  title: qcvn41Title,
  citation: "Phần 47.14, biển số IE.463a–IE.463c",
  url: qcvn41Url,
  quote: "Biển số IE.463 chỉ dẫn đến Công trình kiểm soát tải trọng xe, bao gồm: biển số IE.463a chỉ dẫn khoảng cách đến Công trình kiểm soát tải trọng xe; Biển số IE.463b chỉ dẫn hướng rẽ vào nơi đặt Công trình kiểm soát tải trọng xe; biển số IE.463c chỉ dẫn lối vào Công trình kiểm soát tải trọng xe."
};
const emergencyLaneSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.51, biển số I.448",
  url: qcvn41Url,
  quote: "Biển chỉ dẫn gồm 4 cặp biển ở các cự ly 2 km, 1 km, 300 m và tại chỗ rẽ nhằm chỉ dẫn cho người tham gia giao thông biết vị trí và khoảng cách có làn cứu nạn. Vị trí biển đặt ở vị trí thuận lợi, dễ quan sát, cự ly có thể điều chỉnh cho phù hợp."
};
const obstacleDirectionSignsEvidence = {
  title: qcvn41Title,
  citation: "Phần 46.2, biển số IE.468a–IE.468c",
  url: qcvn41Url,
  quote: "Biển số IE.468 chỉ dẫn chướng ngại vật phía trước để báo cảnh báo phía trước có sự cản trở lưu thông bình thường (nằm bên trong phần xe chạy hay ngay sát phần đường xe chạy) và chỉ dẫn hướng đi qua đó cần đặt biển. Biển số IE.468a chỉ dẫn đi theo hướng bên trái; Biển số IE.468b chỉ dẫn đi được cả hai hướng; Biển số IE.468c chỉ dẫn đi theo hướng bên phải."
};
const curveArrowMarkerEvidence = {
  title: qcvn41Title,
  citation: "Phần 47.20, biển số IE.469",
  url: qcvn41Url,
  quote: "Biển số IE.469 (tiêu phản quang) chỉ dẫn hướng rẽ để nhắc người điều khiển phương tiện chuẩn bị đổi hướng đi khi sắp vào đường cong nguy hiểm, có bán kính cong nhỏ. Biển được đặt ở phía lưng đường cong, cách mép lề đường 0,5 m hoặc đặt trên dải phân cách giữa đối với đường có hai chiều xe chạy riêng biệt."
};
const roadMarkingsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục G, mục G1.1–G1.2 và G4, vạch 1.1–1.4, 2.1–2.4, 9.2–9.3",
  url: qcvn41Url,
  quote: "Vạch tim đường (vạch phân cách hai chiều xe chạy) có thể là vạch 1.1 hoặc vạch 1.2. Vạch 1.2 dùng để phân chia hai chiều xe chạy ngược chiều; xe không được lấn làn, không được đè lên vạch. Vạch 1.3 dùng để phân chia hai chiều xe chạy ngược chiều; xe không được lấn làn, không được đè lên vạch. Vạch 1.4 dùng để phân chia hai chiều xe chạy ngược chiều. Xe trên làn đường tiếp giáp với vạch đứt nét được phép cắt qua và sử dụng làn ngược chiều khi cần thiết; xe trên làn đường tiếp giáp với vạch liền nét không được lấn làn hoặc đè lên vạch. Vạch 2.1 dùng để phân chia các làn xe cùng chiều; xe được phép thực hiện việc chuyển làn đường qua vạch 2.1. Vạch 2.2 dùng để phân chia các làn xe cùng chiều trong trường hợp không cho phép xe chuyển làn hoặc sử dụng làn khác; xe không được lấn làn, không được đè lên vạch. Vạch 2.4 dùng để phân chia các làn xe cùng chiều; xe trên làn đường tiếp giáp với vạch đứt nét được phép cắt qua khi cần thiết; xe trên làn đường tiếp giáp với vạch liền nét không được lấn làn hoặc đè lên vạch. Vạch 9.2 quy định vị trí dừng xe của các phương tiện vận tải hành khách công cộng trên đường như xe buýt, xe tắc xi. Các loại phương tiện khác và người đi bộ không được dừng, đỗ trong phạm vi kẻ vạch và trong khoảng cách 15 m từ vị trí vạch về hai phía theo phương dọc đường. Vạch mũi tên chỉ hướng trên mặt đường được sử dụng để chỉ hướng xe phải đi."
};
const distanceMarkerEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục G, mục G2.8, vạch 7.8",
  url: qcvn41Url,
  quote: "Vạch 7.8 là vạch dùng để xác định khoảng cách trên đường, giúp cho lái xe biết cần phải giãn cách cự ly để đảm bảo an toàn với xe chạy phía trước. Vạch thường được sử dụng trên đường ô tô cao tốc ở những nơi hay xảy ra tai nạn do vượt xe hoặc đâm va từ phía sau hoặc ở những vị trí có yêu cầu đặc biệt."
};
const pedestrianCrossingMarkingEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục G, mục G2.3 và G2.6, vạch 7.3 và 7.6",
  url: qcvn41Url,
  quote: "Vạch 7.3: Vạch đi bộ qua đường. Ý nghĩa sử dụng: Vạch đi bộ qua đường xác định phạm vi phần đường dành cho người đi bộ cắt qua đường. Vạch 7.6: Vạch chỉ dẫn sắp đến chỗ có bố trí vạch đi bộ qua đường. Ý nghĩa sử dụng: Vạch 7.6 sử dụng để báo hiệu sắp đến chỗ có bố trí vạch đi bộ qua đường; đặc biệt đối với các chỗ bố trí vạch đi bộ qua đường ở giữa đoạn đường nối hai nút để cảnh báo người lái xe phải nhường đường cho người đi bộ qua đường."
};
const pedestrianAndBicycleSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục D.4–D.6, biển số R.304–R.306",
  url: qcvn41Url,
  quote: "a) Để báo đường dành cho xe thô sơ (kể cả xe của người khuyết tật) và người đi bộ, đặt biển số R.304 “Đường dành cho xe thô sơ”.\nb) Biển có hiệu lực bắt buộc các loại xe thô sơ (kể cả xe của người khuyết tật) và người đi bộ phải dùng đường dành riêng này để đi và cấm các xe cơ giới kể cả xe gắn máy, các xe được ưu tiên theo quy định đi vào đường đã đặt biển này, trừ trường hợp đi cắt ngang qua nhưng phải đảm bảo tuyệt đối an toàn cho xe thô sơ và người đi bộ.\na) Để báo đường dành cho người đi bộ, đặt biển số R.305 “Đường dành cho người đi bộ”.\nb) Các loại xe cơ giới và thô sơ (trừ xe đạp và xe lăn dành cho người khuyết tật), kể cả các xe được ưu tiên theo quy định không được phép đi vào trên đường đã đặt biển này, trừ trường hợp đi cắt ngang qua nhưng phải đảm bảo tuyệt đối an toàn cho người đi bộ.\na) Để báo tốc độ tối thiểu cho phép các xe cơ giới chạy, đặt biển số R.306 “Tốc độ tối thiểu cho phép”."
};
const residentialAreaSignEvidence = {
  title: qcvn41Title,
  citation: "Điều 53, biển số R.420–R.421",
  url: qcvn41Url,
  quote: "Đoạn đường qua khu vực đông dân cư được xác định bắt đầu bằng biển số R.420 “Bắt đầu khu đông dân cư” và kết thúc bằng biển số R.421 “Hết khu đông dân cư”."
};
const railwayAndTunnelWarningEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.10–C.11, C.18, C.40, C.42–C.43, biển số W.210–W.211, W.218, W.240, W.242–W.243",
  url: qcvn41Url,
  quote: "Để báo trước sắp đến chỗ giao nhau giữa đường bộ và đường sắt có rào chắn (cần chắn hoặc giàn chắn), đặt biển số W.210 “Giao nhau với đường sắt có rào chắn”.\na) Để báo trước sắp đến chỗ giao nhau giữa đường bộ và đường sắt không có rào chắn, không có người điều khiển giao thông, đặt biển số W.211 “Giao nhau với đường sắt không có rào chắn”.\nĐể báo trước sắp đến đường có cổng chắn ngang, kiểu cổng như cổng thành, cầu vượt đường bộ dạng cầu vòm, v.v... mà có ảnh hưởng đến giao thông, đặt biển số W.218 “Cửa chui”.\nĐể nhắc lái xe chú ý chuẩn bị đi vào hầm đường bộ, đặt biển số W.240 “Đường hầm”.\nĐể báo ùn tắc giao thông, đặt biển số W.241 “Ùn tắc giao thông”.\nĐể bổ sung cho biển số W.211 “Giao nhau với đường sắt không có rào chắn”, đặt biển số W.242(a,b) để chỉ chỗ đường sắt giao vuông góc đường bộ.\nĐể báo trước sắp đến vị trí giao cắt đường bộ với đường sắt cùng mức, không vuông góc và không có người gác, không có rào chắn, đặt biển số W243 “Nơi đường sắt giao không vuông góc với đường bộ”."
};
const intersectionAndPriorityWarningEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.5–C.9, biển số W.205–W.209",
  url: qcvn41Url,
  quote: "Để báo trước sắp đến nơi giao nhau cùng mức của các tuyến đường cùng cấp (không có đường nào ưu tiên) trên cùng một mặt bằng, đặt biển số W.205(a,b,c,d,e) “Đường giao nhau”.\nĐể báo trước nơi giao nhau có bố trí đảo an toàn ở giữa nút giao, các loại xe qua nút giao phải đi vòng xuyến quanh đảo an toàn theo chiều mũi tên, đặt biển số W.206 “Giao nhau chạy theo vòng xuyến”.\na) Trên đường ưu tiên, để báo trước sắp đến nơi giao nhau với đường không ưu tiên, đặt biển số W.207 (a,b,c,d,e,f,g,h,i,k,l).\na) Trên đường không ưu tiên, để báo trước sắp đến nơi giao nhau với đường ưu tiên, đặt biển số W.208 “Giao nhau với đường ưu tiên”.\nb) Các xe đi trên đường có đặt biển số W.208 phải nhường đường cho xe đi trên đường ưu tiên khi qua nơi giao nhau (trừ các loại xe được quyền ưu tiên theo quy định).\na) Để báo trước nơi giao nhau có điều khiển giao thông bằng tín hiệu đèn trong trường hợp người tham gia giao thông khó quan sát thấy đèn để kịp thời xử lý, đặt biển số W.209 “Giao nhau có tín hiệu đèn”."
};
const dangerousCurveSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.1, biển số W.201c",
  url: qcvn41Url,
  quote: "Biển số W.201c chỗ ngoặt nguy hiểm có nguy cơ lật xe bên phải khi đường cong vòng sang trái;"
};
const narrowAndTwoWayWarningEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.3–C.4, biển số W.203–W.204; Phụ lục B.32, biển số P.132",
  url: qcvn41Url,
  quote: "a) Để báo trước sắp đến một đoạn đường bị thu hẹp đột ngột, đặt biển số W.203 (a,b,c): - Biển số W.203a đặt trong trường hợp đường bị thu hẹp cả hai bên; - Biển số W.203b hoặc biển số W.203c đặt trong trường hợp đường bị thu hẹp về phía trái hoặc phía phải.\nd) Ở tất cả những vị trí đường bị hẹp, người tham gia giao thông phải chú ý quan sát giao thông ngược chiều. Xe đi ở chiều đường bị thu hẹp phải nhường đường cho xe đi ngược chiều.\na) Để báo trước sắp đến đoạn đường do sửa chữa hoặc có trở ngại ở một phía đường mà phải tổ chức đi lại cho phương tiện cả hai chiều trên phía đường còn lại hoặc để báo trước đoạn đường đôi tạm thời hoặc đoạn đường có chiều xe đi và về đi chung thì đặt biển số W.204 “Đường hai chiều”.\na) Để báo các loại xe (cơ giới và thô sơ) kể cả các xe được ưu tiên theo quy định khi thấy biển số P.132 phải nhường đường cho các loại xe cơ giới đang đi theo hướng ngược lại qua các đoạn đường hẹp hoặc cầu hẹp, đặt biển số P.132 “Nhường đường cho xe cơ giới đi ngược chiều qua đường hẹp”."
};
const surfaceAndPedestrianWarningEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.22, C.24–C.25, C.28, C.44, biển số W.222, W.224–W.225, W.228, W.244",
  url: qcvn41Url,
  quote: "a) Để báo trước sắp tới đoạn đường có thể xảy ra trơn trượt đặc biệt là khi thời tiết xấu, mưa phùn, đặt biển số W.222a báo hiệu “Đường trơn”. Khi gặp biển này, tốc độ xe chạy phải giảm phù hợp và người tham gia giao thông phải thận trọng.\na) Để báo trước sắp tới phần đường dành cho người đi bộ sang qua đường, đặt biển số W.224 “Đường người đi bộ cắt ngang”. Gặp biển này các xe phải giảm tốc độ, nhường ưu tiên cho người đi bộ và chỉ được chạy xe khi không gây nguy hiểm cho người đi bộ.\na) Để báo trước là gần đến đoạn đường thường có trẻ em đi ngang qua hoặc tụ tập trên đường như ở vườn trẻ, trường học, câu lạc bộ, đặt biển số W.225 “Trẻ em”.\nc) Gặp biển này, người tham gia giao thông phải đi chậm và thận trọng đề phòng khả năng xuất hiện và di chuyển bất ngờ của trẻ em trên mặt đường.\na) Để báo trước gần tới đoạn đường có hiện tượng đất đá từ trên ta luy dương sụt lở bất ngờ gây nguy hiểm cho xe cộ và người đi đường, đặt biển số W.228(a,b) “Đá lở”.\nb) Để báo trước nơi có kết cấu mặt đường rời rạc, khi phương tiện đi qua, làm cho các viên đá, sỏi bắn lên gây nguy hiểm và mất an toàn cho người và phương tiện tham gia giao thông, đặt biển số W.228c “Sỏi đá bắn lên”.\nDùng để cảnh báo nguy hiểm đoạn đường phía trước thường xảy ra tai nạn để lái xe cần đặc biệt chú ý, đặt biển số W.244 “Đoạn đường hay xảy ra tai nạn”.\nDùng để báo trước cho lái xe biết phía trước có chướng ngại vật, xe cần giảm tốc độ và đi theo chỉ dẫn trên biển báo, đặt biển số W.246a “Chú ý chướng ngại vật - Vòng tránh ra hai bên”, biển số W.246b “Chú ý chướng ngại vật - Vòng tránh sang bên trái” và biển số W.246c “Chú ý chướng ngại vật - Vòng tránh sang bên phải”."
};
const priorityAndDividedRoadEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.2, E.6, biển số I.402, I.406; Phụ lục C.34–C.36, biển số W.234–W.236",
  url: qcvn41Url,
  quote: "Đến hết đoạn đường quy định là ưu tiên, đặt biển số I.402 “Hết đoạn đường ưu tiên”.\na) Để chỉ dẫn cho người tham gia giao thông cơ giới biết mình được quyền ưu tiên đi trước trên đoạn đường hẹp, đặt biển số I.406 “Được ưu tiên qua đường hẹp”.\nTrên đường một chiều, để báo trước sắp đến vị trí giao nhau với đường hai chiều, đặt biển số W.234 “Giao nhau với đường hai chiều”.\nĐể báo trước sắp đến đoạn đường có chiều đi và chiều về phân biệt bằng dải phân cách cứng, đặt biển số W.235 “Đường đôi”.\nĐể báo trước sắp kết thúc đoạn đường có chiều đi và chiều về phân biệt bằng dải phân cách cứng, đặt biển số W.236 “Kết thúc đường đôi”. Đường hai chiều được phân chia bằng vạch sơn không phải đặt biển này."
};
const worksiteAndTerrainWarningEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục C.13–C.14, C.17, C.19–C.21, C.27–C.30, biển số W.213–W.221, W.227–W.232",
  url: qcvn41Url,
  quote: "Để báo trước sắp đến cầu hẹp là loại cầu có chiều rộng phần xe chạy nhỏ hơn hoặc bằng 4,50 m, đặt biển số W.212 “Cầu hẹp”. Khi qua các cầu này lái xe phải đi chậm, quan sát, nhường nhau và dừng lại chờ ở hai đầu cầu.\nĐể báo phía trước gặp cầu quay, cầu cất là loại cầu trong từng thời gian có cắt giao thông đường bộ bằng cách quay hoặc nâng nhịp thông thuyền để cho tàu thuyền qua lại, đặt biển số W.214 “Cầu quay - cầu cất”. Các phương tiện đi trên đường bộ phải dừng lại chờ đợi.\nĐể báo trước sắp tới những vị trí có kè chắn vực sâu hoặc sông suối ở phía trước hoặc đi sát đường, cần đề phòng tình huống nguy hiểm rơi xuống vực sâu hoặc sông suối, đặt biển số W.215a “Kè, vực sâu phía trước” hoặc biển số W.215b “Kè, vực sâu bên đường phía bên phải” hoặc biển số W.215c “Kè, vực sâu bên đường phía bên trái”.\nĐể báo trước sắp đến bến phà, phải đặt biển số W.217 “Bến phà”. Người tham gia giao thông phải tuân theo nội quy bến phà.\nĐể báo trước sắp tới đoạn đường xuống dốc nguy hiểm, đặt biển số W.219 “Dốc xuống nguy hiểm”.\na) Để báo trước sắp tới đoạn đường lên dốc nguy hiểm, đặt biển số W.220 “Dốc lên nguy hiểm”.\nĐể báo trước sắp tới đoạn đường có mặt đường không bằng phẳng, lồi lõm, v.v.. xe chạy với tốc độ cao sẽ nguy hiểm, đặt biển số W.221 (a,b): - Biển số W.221a “Đường lồi lõm” đặt trong trường hợp đường đang tốt, xe chạy nhanh lại đột ngột chuyển sang những đoạn lồi lõm, gập ghềnh, ổ gà, lượn sóng.\nĐể báo trước gần tới đoạn đường đang tiến hành thi công sửa chữa, cải tạo, nâng cấp có người và máy móc đang làm việc trên mặt đường, đặt biển số W.227 báo hiệu “Công trường”. Khi gặp biển báo này tốc độ xe chạy phải giảm cho thích hợp, không gây nguy hiểm cho người và máy móc trên đoạn đường đó.\na) Để báo trước gần tới đoạn đường có hiện tượng đất đá từ trên ta luy dương sụt lở bất ngờ gây nguy hiểm cho xe cộ và người đi đường, đặt biển số W.228(a,b) “Đá lở”.\nb) Để báo trước nơi có kết cấu mặt đường rời rạc, khi phương tiện đi qua, làm cho các viên đá, sỏi bắn lên gây nguy hiểm và mất an toàn cho người và phương tiện tham gia giao thông, đặt biển số W.228c “Sỏi đá bắn lên”.\nc) Để cảnh báo những đoạn nền đường yếu, đoạn đường đang theo dõi lún mà việc vận hành xe ở tốc độ cao có thể gây nguy hiểm, đặt biển số W.228d “Nền đường yếu”. Lái xe cần chú ý giảm tốc độ hợp lý.\na) Để báo trước gần tới đoạn đường thường có gia súc thả rông hoặc lùa qua ngang đường, đường ở vùng đồng cỏ của nông trường chăn nuôi, vùng thảo nguyên ..., đặt biển số W.230 “Gia súc”. Người tham gia giao thông có trách nhiệm đi chậm, quan sát và dừng lại bảo đảm cho gia súc có thể qua đường không bị nguy hiểm.\na) Để báo trước gần tới đoạn đường thường có gió ngang thổi mạnh gây nguy hiểm, đặt biển số W.232 “Gió ngang”. Người tham gia giao thông cần phải điều chỉnh tốc độ xe chạy cho thích hợp, đề phòng gió thổi mạnh gây lật xe.\na) Ở những nơi có đường dây điện cắt ngang phía trên tuyến đường, đặt biển số W.239a “Đường cáp điện ở phía trên” và kèm theo biển số S.509a “Chiều cao an toàn” ở phía dưới."
};
const roadClassAndLaneGuideEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục D.11–D.16, biển số R.403–R.415",
  url: qcvn41Url,
  quote: "a) Để báo hiệu bắt đầu đường dành cho các loại ô tô đi lại, đặt biển số R.403a “Đường dành cho xe ô tô”.\nb) Để báo hiệu bắt đầu đường dành cho các loại ô tô, xe máy đi lại, đặt biển số R.403b “Đường dành cho xe ô tô, xe máy”.\nc) Để báo hiệu bắt đầu đường dành cho xe buýt, đặt biển số R.403c “Đường dành cho xe buýt”.\nd) Để báo hiệu bắt đầu đường dành cho xe ô tô con, đặt biển số R.403d “Đường dành cho xe ô tô con”.\nl) Ngoài các loại phương tiện quy định trên biển được đi lại, các loại phương tiện giao thông khác không được phép đi vào đoạn đường có đặt các biển số R.403a, R.403b, R.403c, R.403d, R.403e, R.403f, R.403g, R.403h, R.403k.\na) Đến hết đoạn đường dành cho ô tô đi lại, đặt biển số R.404a “Hết đoạn đường dành cho xe ô tô”.\na) Để báo hiệu cho người tham gia giao thông biết số lượng làn đường và loại xe được phép lưu thông trên từng làn đường theo quy định, đặt biển số R.415a “Biển gộp làn đường theo phương tiện”. Căn cứ vào vạch sơn thực tế trên đường để thực hiện việc chuyển làn cho phù hợp giữa các làn được phép lưu thông.\nb) Khi đến gần nơi đường bộ giao nhau, xe được phép chuyển làn để đi theo hành trình mong muốn. Việc chuyển làn phải thực hiện theo đúng các quy định."
};
const routeAndParkingSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.5, E.7–E.10, biển số I.405, I.407–I.410",
  url: qcvn41Url,
  quote: "- Biển số I.405 (a,b) để chỉ lối rẽ vào đường cụt. Tùy theo lối rẽ vào đường cụt mà chọn kiểu biển cho phù hợp. Biển này đặt trên đường chính trước khi đến nơi đường giao nhau để rẽ vào đường cụt.\na) Để chỉ dẫn những đoạn đường chạy một chiều, đặt biển số I.407(a,b,c) “Đường một chiều”.\nb) Biển số I.407 (a,b,c) chỉ cho phép các loại phương tiện giao thông đi theo chiều vào theo mũi tên chỉ, cấm quay đầu ngược lại (trừ các xe được quyền ưu tiên theo quy định).\na) Để chỉ dẫn những nơi được phép đỗ xe, những bãi đỗ xe, bến xe, v.v..., đặt biển số I.408 “Nơi đỗ xe”.\na) Để chỉ dẫn những nơi được phép đỗ xe một phần trên hè phố rộng, đặt biển số I.408a “Nơi đỗ xe một phần trên hè phố”. Xe phải đỗ sao cho các bánh phía ghế phụ trên hè phố.\na) Để chỉ dẫn vị trí được phép quay đầu xe, đặt biển số I.409 “Chỗ quay xe”.\na) Để chỉ dẫn khu vực được phép quay đầu xe, đặt biển số I.410 “Khu vực quay xe”. Trên biển mô tả cách thức tiến hành quay xe."
};
const endAndSpecialSpeedSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.33–B.35, biển số DP.133–DP.135; Phụ lục D.7, biển số R.307",
  url: qcvn41Url,
  quote: "Để báo hết đoạn đường cấm vượt, đặt biển số DP.133 “Hết cấm vượt”. Biển có tác dụng báo cho người tham gia giao thông biết hiệu lực của các biển số P.125 và biển số P.126 hết tác dụng.\na) Đến hết đoạn đường tốc độ tối đa, đặt biển số DP.134 “Hết tốc độ tối đa cho phép”.\nb) Biển có giá trị báo cho người tham gia giao thông biết hiệu lực của biển số P.127 hết tác dụng.\na) Đến hết đoạn đường mà nhiều biển báo cấm cùng hết hiệu lực, đặt biển số DP.135 “Hết tất cả các lệnh cấm”.\na) Đến hết đoạn đường tốc độ tối thiểu, đặt biển số R.307 “Hết hạn chế tốc độ tối thiểu”.\nb) Biển có giá trị báo cho người tham gia giao thông biết hiệu lực của biển số R.306 hết tác dụng, kể từ biển này các xe được phép chạy chậm hơn trị số ghi trên biển nhưng không được gây cản trở các xe khác."
};
const pedestrianGradeSeparationSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục E.24–E.25, biển số I.424(a,b,c,d)",
  url: qcvn41Url,
  quote: "Để chỉ dẫn cho người đi bộ sử dụng cầu vượt qua đường, đặt biển số I.424(a,b) “Cầu vượt qua đường cho người đi bộ”. Tùy hướng thực tế của người đi bộ qua đường mà sử dụng biển số I.424a hoặc biển số I.424b cho phù hợp.\nĐể chỉ dẫn cho người đi bộ sử dụng hầm chui qua đường, đặt biển số I.424(c,d) “Hầm chui qua đường cho người đi bộ”. Tùy hướng thực tế của người đi bộ qua hầm mà sử dụng biển số I.424c hoặc I.424d cho phù hợp."
};
const laneAndBusLaneSignsEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục D.13, D.16, D.17, biển số R.411, R.415, I.413",
  url: qcvn41Url,
  quote: "a) Để báo hiệu cho người tham gia giao thông biết số lượng làn đường trên mặt đường và hướng đi trên mỗi làn đường theo vạch kẻ đường, đặt biển số R.411 “Hướng đi trên mỗi làn đường theo vạch kẻ đường”. Biển sử dụng phối hợp với vạch kẻ đường (loại vạch 9.3: vạch mũi tên chỉ hướng trên mặt đường).\na) Để chỉ dẫn cho người tham gia giao thông biết đường phía trước có làn đường dành riêng cho ô tô khách theo chiều ngược lại, đặt biển số I.413a “Đường phía trước có làn đường dành cho ô tô khách”.\nb) Để chỉ dẫn cho người tham gia giao thông biết ở nơi đường giao nhau rẽ phải hoặc rẽ trái là rẽ ra đường có làn đường dành riêng cho ô tô khách, đặt biển số I.413b hoặc biển số I.413c báo hiệu “Rẽ ra đường có làn đường dành cho ô tô khách”."
};
const noStraightThroughSignEvidence = {
  title: qcvn41Title,
  citation: "Phụ lục B.36, biển số P.136",
  url: qcvn41Url,
  quote: "Đường ở phía trước cấm tất cả các loại xe (trừ xe ưu tiên theo qui định) đi thẳng, đặt biển số P.136 “Cấm đi thẳng”. Biển được đặt ở vị trí ngay trước nút giao của đường cấm đi thẳng."
};
const trafficLawQuotes = {
  1: ["Khoản 5 Điều 2", "Phần đường xe chạy là phần của đường bộ được sử dụng cho phương tiện giao thông đường bộ đi lại."],
  2: ["Khoản 6 Điều 2", "Làn đường là một phần của phần đường xe chạy được chia theo chiều dọc của đường, có đủ chiều rộng cho xe chạy an toàn."],
  6: ["Khoản 9 Điều 2", "Người điều khiển phương tiện tham gia giao thông đường bộ bao gồm: người điều khiển xe cơ giới (sau đây gọi là người lái xe), người điều khiển xe thô sơ, người điều khiển xe máy chuyên dùng."],
  7: ["Khoản 9 Điều 2", "người điều khiển xe cơ giới (sau đây gọi là người lái xe)"],
  10: ["Khoản 2 Điều 2", "Phương tiện giao thông đường bộ là các loại xe, bao gồm: phương tiện giao thông cơ giới đường bộ (sau đây gọi là xe cơ giới), phương tiện giao thông thô sơ đường bộ (sau đây gọi là xe thô sơ), xe máy chuyên dùng và các loại xe tương tự."],
  11: ["Khoản 8 Điều 2", "Người tham gia giao thông đường bộ bao gồm: người điều khiển, người được chở trên phương tiện tham gia giao thông đường bộ; người điều khiển, dẫn dắt vật nuôi trên đường bộ; người đi bộ trên đường bộ."],
  12: ["Khoản 9 Điều 2", "Người điều khiển phương tiện tham gia giao thông đường bộ bao gồm: người điều khiển xe cơ giới (sau đây gọi là người lái xe), người điều khiển xe thô sơ, người điều khiển xe máy chuyên dùng."],
  13: ["Khoản 10 Điều 2", "Người điều khiển giao thông đường bộ (sau đây gọi là người điều khiển giao thông) bao gồm: Cảnh sát giao thông và người được giao nhiệm vụ hướng dẫn giao thông trên đường bộ."],
  14: ["Khoản 1 Điều 18", "Dừng xe là trạng thái đứng yên tạm thời của xe trong một khoảng thời gian cần thiết đủ để cho người lên xe, xuống xe, xếp dỡ hàng hóa, kiểm tra kỹ thuật xe hoặc hoạt động khác. Khi dừng xe không được tắt máy và không được rời khỏi vị trí lái, trừ trường hợp rời khỏi vị trí lái để đóng, mở cửa xe, xếp dỡ hàng hóa, kiểm tra kỹ thuật xe nhưng phải sử dụng phanh đỗ xe hoặc thực hiện biện pháp an toàn khác."],
  15: ["Khoản 2 Điều 18", "Đỗ xe là trạng thái đứng yên của xe không giới hạn thời gian. Khi đỗ xe, người điều khiển phương tiện tham gia giao thông đường bộ chỉ được rời khỏi xe khi đã sử dụng phanh đỗ xe hoặc thực hiện biện pháp an toàn khác. Xe đỗ trên đoạn đường dốc phải đánh lái về phía lề đường, chèn bánh."],
  17: ["Khoản 13 Điều 2", "Thiết bị an toàn cho trẻ em là thiết bị có đủ khả năng bảo đảm an toàn cho trẻ em ở tư thế ngồi hoặc nằm trên xe ô tô, được thiết kế để giảm nguy cơ chấn thương cho người dùng trong trường hợp xảy ra va chạm hoặc xe ô tô giảm tốc độ đột ngột, bằng cách hạn chế sự di chuyển của cơ thể trẻ em."],
  19: ["Khoản 20 Điều 9", "Đặt, để chướng ngại vật, vật cản khác trái phép trên đường bộ; rải vật sắc nhọn, đổ chất gây trơn trượt trên đường bộ; làm rơi vãi đất đá, hàng hóa, vật liệu xây dựng, phế thải trên đường bộ; đổ, xả thải, làm rơi vãi hóa chất, chất thải gây mất an toàn giao thông đường bộ."],
  20: ["Khoản 8 Điều 9", "Đưa xe cơ giới, xe máy chuyên dùng không bảo đảm quy định của pháp luật về an toàn kỹ thuật và bảo vệ môi trường, phương tiện khác không đủ điều kiện theo quy định của pháp luật để tham gia giao thông đường bộ."],
  21: ["Khoản 5 Điều 9", "Đua xe, tổ chức đua xe, xúi giục, giúp sức, cổ vũ đua xe trái phép; điều khiển phương tiện tham gia giao thông đường bộ lạng lách, đánh võng, rú ga liên tục."],
  24: ["Khoản 2 Điều 9", "Điều khiển phương tiện tham gia giao thông đường bộ mà trong máu hoặc hơi thở có nồng độ cồn."],
  187: [
    ["Khoản 1 Điều 10", "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."],
    ["Khoản 1 Điều 12", "Người lái xe, người điều khiển xe máy chuyên dùng phải chấp hành quy định về tốc độ, khoảng cách an toàn tối thiểu với xe phía trước cùng làn đường hoặc phần đường."],
    ["Điểm c khoản 4 Điều 11", "Tín hiệu đèn màu đỏ là cấm đi."],
    ["Khoản 6 Điều 14", "Không được vượt xe trong trường hợp sau đây: a) Khi không bảo đảm các điều kiện quy định tại khoản 3 Điều này; b) Trên cầu hẹp có một làn đường; c) Đường cong có tầm nhìn bị hạn chế; d) Trên đường hai chiều tại khu vực đỉnh dốc có tầm nhìn bị hạn chế; đ) Nơi đường giao nhau, đường bộ giao nhau cùng mức với đường sắt; e) Khi điều kiện thời tiết hoặc đường không bảo đảm an toàn cho việc vượt; g) Khi gặp xe ưu tiên; h) Ở phần đường dành cho người đi bộ qua đường; i) Khi có người đi bộ, xe lăn của người khuyết tật qua đường; k) Trong hầm đường bộ."],
  ],
  182: [
    ["Khoản 4 Điều 4", "Bảo đảm công bằng, bình đẳng, an toàn đối với người tham gia giao thông đường bộ; tạo thuận lợi cho trẻ em, phụ nữ mang thai, người già yếu, người khuyết tật trong tham gia giao thông đường bộ; xây dựng văn hóa giao thông; giáo dục, phổ biến, bồi dưỡng kiến thức pháp luật về giao thông đường bộ cho trẻ em, học sinh để hình thành, nâng cao ý thức tự bảo vệ bản thân và tự giác chấp hành pháp luật khi tham gia giao thông đường bộ."],
    ["Khoản 1 Điều 10", "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."],
    ["Khoản 3 Điều 15", "Khi chuyển hướng, người lái xe, người điều khiển xe máy chuyên dùng phải nhường đường cho người đi bộ, xe thô sơ, xe đi ngược chiều và chỉ chuyển hướng khi không gây trở ngại hoặc nguy hiểm cho người, phương tiện khác."],
  ],
  186: ["Khoản 2 Điều 12", "Người điều khiển phương tiện tham gia giao thông đường bộ phải bảo đảm tốc độ phù hợp điều kiện của cầu, đường, mật độ giao thông, địa hình, thời tiết và các yếu tố ảnh hưởng khác để bảo đảm an toàn."],
  190: [
    ["Khoản 2 Điều 11", "Người tham gia giao thông đường bộ phải chấp hành báo hiệu đường bộ theo thứ tự ưu tiên từ trên xuống dưới như sau: a) Hiệu lệnh của người điều khiển giao thông; b) Tín hiệu đèn giao thông; c) Biển báo hiệu đường bộ; d) Vạch kẻ đường và các dấu hiệu khác trên mặt đường; đ) Cọc tiêu, tường bảo vệ, rào chắn, đinh phản quang, tiêu phản quang, cột Km, cọc H; e) Thiết bị âm thanh báo hiệu đường bộ."],
    ["Khoản 3 Điều 15", "Khi chuyển hướng, người lái xe, người điều khiển xe máy chuyên dùng phải nhường đường cho người đi bộ, xe thô sơ, xe đi ngược chiều và chỉ chuyển hướng khi không gây trở ngại hoặc nguy hiểm cho người, phương tiện khác."],
  ],
  189: [
    ["Khoản 4 Điều 4", "Bảo đảm công bằng, bình đẳng, an toàn đối với người tham gia giao thông đường bộ; tạo thuận lợi cho trẻ em, phụ nữ mang thai, người già yếu, người khuyết tật trong tham gia giao thông đường bộ; xây dựng văn hóa giao thông; giáo dục, phổ biến, bồi dưỡng kiến thức pháp luật về giao thông đường bộ cho trẻ em, học sinh để hình thành, nâng cao ý thức tự bảo vệ bản thân và tự giác chấp hành pháp luật khi tham gia giao thông đường bộ."],
    ["Khoản 1 Điều 10", "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."],
    ["Khoản 3 Điều 15", "Khi chuyển hướng, người lái xe, người điều khiển xe máy chuyên dùng phải nhường đường cho người đi bộ, xe thô sơ, xe đi ngược chiều và chỉ chuyển hướng khi không gây trở ngại hoặc nguy hiểm cho người, phương tiện khác."],
  ],
  192: [
    ["Khoản 1 Điều 10", "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."],
    ["Khoản 6 Điều 18", "Trên đường phố, người điều khiển phương tiện tham gia giao thông đường bộ chỉ được dừng xe, đỗ xe sát theo lề đường, vỉa hè phía bên phải theo chiều đi của mình; bánh xe gần nhất không được cách xa lề đường, vỉa hè quá 0,25 mét và không gây cản trở, nguy hiểm cho người và phương tiện tham gia giao thông đường bộ."],
    ["Khoản 2 Điều 9", "Điều khiển phương tiện tham gia giao thông đường bộ mà trong máu hoặc hơi thở có nồng độ cồn."],
  ],
  193: ["Điều 21", "1. Chỉ được sử dụng tín hiệu còi của phương tiện tham gia giao thông đường bộ trong các trường hợp sau đây: a) Báo hiệu cho người tham gia giao thông đường bộ khi xuất hiện tình huống có thể mất an toàn giao thông; b) Báo hiệu chuẩn bị vượt xe. 2. Không sử dụng còi liên tục; không sử dụng còi có âm lượng không đúng quy định; không sử dụng còi trong thời gian từ 22 giờ ngày hôm trước đến 05 giờ ngày hôm sau trong khu đông dân cư, khu vực cơ sở khám bệnh, chữa bệnh, trừ xe ưu tiên."],
  200: [
    ["Khoản 1 Điều 10", "Người tham gia giao thông đường bộ phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định, chấp hành báo hiệu đường bộ và các quy tắc giao thông đường bộ khác."],
    ["Khoản 2 Điều 11", "Người tham gia giao thông đường bộ phải chấp hành báo hiệu đường bộ theo thứ tự ưu tiên từ trên xuống dưới như sau: a) Hiệu lệnh của người điều khiển giao thông; b) Tín hiệu đèn giao thông; c) Biển báo hiệu đường bộ; d) Vạch kẻ đường và các dấu hiệu khác trên mặt đường; đ) Cọc tiêu, tường bảo vệ, rào chắn, đinh phản quang, tiêu phản quang, cột Km, cọc H; e) Thiết bị âm thanh báo hiệu đường bộ."],
  ],
  27: ["Khoản 7 Điều 9", "Giao xe cơ giới, xe máy chuyên dùng cho người không đủ điều kiện theo quy định của pháp luật để điều khiển xe tham gia giao thông đường bộ."],
  29: ["Khoản 11 Điều 9", "Cải tạo trái phép; cố ý can thiệp làm sai lệch chỉ số trên đồng hồ báo quãng đường đã chạy của xe ô tô; cắt, hàn, tẩy xóa, đục sửa, đóng lại trái phép số khung, số động cơ của xe cơ giới, xe máy chuyên dùng."],
  31: ["Khoản 17 Điều 9", "Sản xuất, sử dụng, mua, bán trái phép biển số xe; điều khiển xe cơ giới, xe máy chuyên dùng gắn biển số xe không do cơ quan nhà nước có thẩm quyền cấp, gắn biển số xe không đúng vị trí; bẻ cong, che lấp biển số xe; làm thay đổi chữ, số, màu sắc, hình dạng, kích thước của biển số xe."],
  32: ["Khoản 5 Điều 9", "Đua xe, tổ chức đua xe, xúi giục, giúp sức, cổ vũ đua xe trái phép; điều khiển phương tiện tham gia giao thông đường bộ lạng lách, đánh võng, rú ga liên tục."],
  33: ["Khoản 5 Điều 11", "a) Biển báo cấm để biểu thị các điều cấm; b) Biển báo nguy hiểm để cảnh báo các tình huống nguy hiểm có thể xảy ra; c) Biển hiệu lệnh để báo hiệu lệnh phải thi hành; d) Biển chỉ dẫn để chỉ dẫn hướng đi hoặc các điều cần biết; đ) Biển phụ để thuyết minh bổ sung cho biển báo cấm, biển báo nguy hiểm, biển hiệu lệnh và biển chỉ dẫn."],
  34: ["Điểm a khoản 3 Điều 12", "Tại nơi có vạch kẻ đường hoặc báo hiệu khác dành cho người đi bộ hoặc tại nơi mà người đi bộ, xe lăn của người khuyết tật đang qua đường;"],
  35: ["Khoản 3 Điều 12", "Người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, giảm tốc độ hoặc dừng lại để bảo đảm an toàn trong các trường hợp sau đây: a) Tại nơi có vạch kẻ đường hoặc báo hiệu khác dành cho người đi bộ hoặc tại nơi mà người đi bộ, xe lăn của người khuyết tật đang qua đường; b) Có báo hiệu cảnh báo nguy hiểm hoặc có chướng ngại vật trên đường; c) Chuyển hướng xe chạy hoặc tầm nhìn bị hạn chế; d) Nơi đường bộ giao nhau cùng mức với đường bộ, đường bộ giao nhau cùng mức với đường sắt; đường hẹp, đường vòng, đường quanh co, đường đèo, dốc; đ) Nơi cầu, cống hẹp, đập tràn, đường ngầm, hầm chui, hầm đường bộ; e) Khu vực có trường học, bệnh viện, bến xe, công trình công cộng tập trung đông người, khu vực đông dân cư, chợ, khu vực đang thi công trên đường bộ, hiện trường vụ tai nạn giao thông đường bộ; g) Có vật nuôi đi trên đường hoặc chăn thả ở ven đường; h) Tránh xe đi ngược chiều hoặc khi cho xe đi phía sau vượt; khi có tín hiệu xin đường, tín hiệu khẩn cấp của xe đi cùng chiều phía trước; i) Điểm dừng xe, đỗ xe trên đường bộ có khách đang lên, xuống xe; k) Gặp xe vận chuyển hàng siêu trường, siêu trọng, hàng hóa nguy hiểm; đoàn người đi bộ; l) Gặp xe ưu tiên; m) Điều kiện trời mưa, gió, sương, khói, bụi, mặt đường trơn trượt, lầy lội, có nhiều đất đá, vật liệu rơi vãi ảnh hưởng đến an toàn giao thông đường bộ; n) Khu vực đang tổ chức kiểm soát giao thông đường bộ."],
  36: ["Điểm b khoản 3 Điều 11", "Hai tay hoặc một tay dang ngang để báo hiệu cho người tham gia giao thông đường bộ ở phía trước và ở phía sau người điều khiển giao thông phải dừng lại; người tham gia giao thông đường bộ ở phía bên phải và bên trái người điều khiển giao thông được đi;"],
  37: ["Điểm a khoản 3 Điều 11", "Tay bên phải giơ thẳng đứng để báo hiệu cho người tham gia giao thông đường bộ ở tất cả các hướng phải dừng lại;"],
  38: ["Khoản 2 Điều 11", "Người tham gia giao thông đường bộ phải chấp hành báo hiệu đường bộ theo thứ tự ưu tiên từ trên xuống dưới như sau: a) Hiệu lệnh của người điều khiển giao thông; b) Tín hiệu đèn giao thông; c) Biển báo hiệu đường bộ; d) Vạch kẻ đường và các dấu hiệu khác trên mặt đường; đ) Cọc tiêu, tường bảo vệ, rào chắn, đinh phản quang, tiêu phản quang, cột Km, cọc H; e) Thiết bị âm thanh báo hiệu đường bộ."],
  39: ["Khoản 12 Điều 11", "Khi ở một vị trí vừa có biển báo hiệu đặt cố định vừa có biển báo hiệu tạm thời mà hai biển có ý nghĩa khác nhau, người tham gia giao thông đường bộ phải chấp hành hiệu lệnh của biển báo hiệu tạm thời."],
  40: ["Điểm b khoản 4 Điều 11", "Tín hiệu đèn màu vàng phải dừng lại trước vạch dừng; trường hợp đang đi trên vạch dừng hoặc đã đi qua vạch dừng mà tín hiệu đèn màu vàng thì được đi tiếp; trường hợp tín hiệu đèn màu vàng nhấp nháy, người điều khiển phương tiện tham gia giao thông đường bộ được đi nhưng phải quan sát, giảm tốc độ hoặc dừng lại nhường đường cho người đi bộ, xe lăn của người khuyết tật qua đường hoặc các phương tiện khác;"],
  41: ["Khoản 1 Điều 12", "Người lái xe, người điều khiển xe máy chuyên dùng phải chấp hành quy định về tốc độ, khoảng cách an toàn tối thiểu với xe phía trước cùng làn đường hoặc phần đường."],
  42: ["Khoản 3 Điều 10", "Khi chở trẻ em dưới 10 tuổi và chiều cao dưới 1,35 mét trên xe ô tô không được cho trẻ em ngồi cùng hàng ghế với người lái xe, trừ loại xe ô tô chỉ có một hàng ghế; người lái xe phải sử dụng, hướng dẫn sử dụng thiết bị an toàn phù hợp cho trẻ em."],
  43: ["Khoản 1 Điều 13", "Phương tiện tham gia giao thông đường bộ di chuyển với tốc độ thấp hơn phải đi về bên phải theo chiều đi của mình."],
  44: ["Khoản 3 Điều 13", "Trên một chiều đường có vạch kẻ phân làn đường, xe thô sơ phải đi trên làn đường bên phải trong cùng, xe cơ giới, xe máy chuyên dùng đi trên làn đường bên trái."],
  46: ["Khoản 1 Điều 14", "Vượt xe là tình huống giao thông trên đường mà mỗi chiều đường xe chạy chỉ có một làn đường dành cho xe cơ giới, xe đi phía sau di chuyển sang bên trái để di chuyển lên trước xe phía trước."],
  47: ["Điểm b khoản 6 Điều 14", "Trên cầu hẹp có một làn đường;"],
  48: ["Khoản 5 Điều 14", "Xe xin vượt phải có báo hiệu nhấp nháy bằng đèn chiếu sáng phía trước hoặc còi, trừ xe thô sơ không có đèn chiếu sáng và còi thì chỉ cần có tín hiệu bằng tay."],
  49: ["Khoản 2 Điều 21", "Không sử dụng còi liên tục; không sử dụng còi có âm lượng không đúng quy định; không sử dụng còi trong thời gian từ 22 giờ ngày hôm trước đến 05 giờ ngày hôm sau trong khu đông dân cư, khu vực cơ sở khám bệnh, chữa bệnh, trừ xe ưu tiên."],
  50: ["Khoản 1 Điều 21", "Chỉ được sử dụng tín hiệu còi của phương tiện tham gia giao thông đường bộ trong các trường hợp sau đây: a) Báo hiệu cho người tham gia giao thông đường bộ khi xuất hiện tình huống có thể mất an toàn giao thông; b) Báo hiệu chuẩn bị vượt xe."],
  51: ["Điểm b khoản 2 Điều 20", "Khi đi trên các đoạn đường qua khu đông dân cư có hệ thống chiếu sáng đang hoạt động;"],
  52: ["Khoản 6 Điều 9", "Dùng tay cầm và sử dụng điện thoại hoặc thiết bị điện tử khác khi điều khiển phương tiện tham gia giao thông đang di chuyển trên đường bộ."],
  53: ["Khoản 6 Điều 14", "Không được vượt xe trong các trường hợp sau đây: a) Khi không bảo đảm các điều kiện quy định tại khoản 3 Điều này; b) Trên cầu hẹp có một làn đường; c) Đường cong có tầm nhìn bị hạn chế; d) Trên đường hai chiều tại khu vực đỉnh dốc có tầm nhìn bị hạn chế; đ) Nơi đường giao nhau, đường bộ giao nhau cùng mức với đường sắt; e) Khi điều kiện thời tiết hoặc đường không bảo đảm an toàn cho việc vượt; g) Khi gặp xe ưu tiên; h) Ở phần đường dành cho người đi bộ qua đường; i) Khi có người đi bộ, xe lăn của người khuyết tật qua đường; k) Trong hầm đường bộ."],
  55: ["Khoản 4 Điều 15", "Không được quay đầu xe ở phần đường dành cho người đi bộ qua đường, trên cầu, đầu cầu, gầm cầu vượt, ngầm, tại nơi đường bộ giao nhau cùng mức với đường sắt, đường hẹp, đường dốc, đoạn đường cong tầm nhìn bị che khuất, trên đường cao tốc, trong hầm đường bộ, trên đường một chiều, trừ khi có hiệu lệnh của người điều khiển giao thông hoặc chỉ dẫn của biển báo hiệu tạm thời."],
  56: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
  57: ["Khoản 2 Điều 13", "Trên đường có nhiều làn đường cho xe đi cùng chiều được phân biệt bằng vạch kẻ phân làn đường, người điều khiển phương tiện tham gia giao thông đường bộ phải cho xe đi trong một làn đường và chỉ được chuyển làn đường ở những nơi cho phép; mỗi lần chuyển làn đường chỉ được phép chuyển sang một làn đường liền kề; khi chuyển làn đường phải có tín hiệu báo trước; phải quan sát bảo đảm khoảng cách an toàn với xe phía trước, phía sau và hai bên mới được chuyển làn."],
  58: ["Khoản 2 Điều 16", "Không được lùi xe ở đường một chiều, khu vực cấm dừng, trên phần đường dành cho người đi bộ qua đường, nơi đường bộ giao nhau, đường bộ giao nhau cùng mức với đường sắt, nơi tầm nhìn bị che khuất, trong hầm đường bộ, trên đường cao tốc."],
  59: ["Khoản 4 Điều 18", "Người điều khiển phương tiện tham gia giao thông đường bộ không được dừng xe, đỗ xe tại các vị trí sau đây: a) Bên trái đường một chiều; b) Trên đoạn đường cong hoặc gần đầu dốc mà tầm nhìn bị che khuất; c) Trên cầu, trừ những trường hợp tổ chức giao thông cho phép; d) Gầm cầu vượt, trừ những nơi cho phép dừng xe, đỗ xe; đ) Song song cùng chiều với một xe khác đang dừng, đỗ trên đường; e) Cách xe ô tô đang đỗ ngược chiều dưới 20 mét trên đường phố hẹp, dưới 40 mét trên đường có một làn xe cơ giới trên một chiều đường; g) Trên phần đường dành cho người đi bộ qua đường; h) Nơi đường giao nhau và trong phạm vi 05 mét tính từ mép đường giao nhau; i) Điểm đón, trả khách; k) Trước cổng và trong phạm vi 05 mét hai bên cổng trụ sở cơ quan, tổ chức có bố trí đường cho xe ra, vào; l) Tại nơi phần đường có chiều rộng chỉ đủ cho một làn xe cơ giới; m) Trong phạm vi an toàn của đường sắt; n) Che khuất biển báo hiệu đường bộ, đèn tín hiệu giao thông; o) Trên đường dành riêng cho xe buýt, trên miệng cống thoát nước, miệng hầm của đường điện thoại, điện cao thế, chỗ dành riêng cho xe chữa cháy lấy nước; trên lòng đường, vỉa hè trái quy định của pháp luật."],
  60: ["Khoản 6 Điều 18", "Trên đường phố, người điều khiển phương tiện tham gia giao thông đường bộ chỉ được dừng xe, đỗ xe sát theo lề đường, vỉa hè phía bên phải theo chiều đi của mình; bánh xe gần nhất không được cách xa lề đường, vỉa hè quá 0,25 mét và không gây cản trở, nguy hiểm cho người và phương tiện tham gia giao thông đường bộ."],
  61: ["Điểm e khoản 4 Điều 18", "Cách xe ô tô đang đỗ ngược chiều dưới 20 mét trên đường phố hẹp, dưới 40 mét trên đường có một làn xe cơ giới trên một chiều đường;"],
  62: ["Điểm a-e khoản 4 Điều 18", "a) Bên trái đường một chiều; b) Trên đoạn đường cong hoặc gần đầu dốc mà tầm nhìn bị che khuất; c) Trên cầu, trừ những trường hợp tổ chức giao thông cho phép; d) Gầm cầu vượt, trừ những nơi cho phép dừng xe, đỗ xe; đ) Song song cùng chiều với một xe khác đang dừng, đỗ trên đường; e) Cách xe ô tô đang đỗ ngược chiều dưới 20 mét trên đường phố hẹp, dưới 40 mét trên đường có một làn xe cơ giới trên một chiều đường;"],
  63: ["Điểm đ khoản 3 Điều 33", "Sử dụng xe để kéo, đẩy xe khác, vật khác, dẫn dắt vật nuôi, mang, vác và chở vật cồng kềnh; chở người đứng trên xe, giá đèo hàng hoặc ngồi trên tay lái; xếp hàng hóa trên xe quá giới hạn quy định;"],
  64: ["Điểm d, e khoản 3 Điều 33", "d) Buông cả hai tay; đi xe bằng một bánh đối với xe mô tô, xe gắn máy hai bánh; đi xe bằng hai bánh đối với xe mô tô, xe gắn máy ba bánh; e) Ngồi về một bên điều khiển xe; đứng, nằm trên xe điều khiển xe; thay người lái xe khi xe đang chạy; quay người về phía sau để điều khiển xe hoặc bịt mắt điều khiển xe; sử dụng chân chống hoặc vật khác quệt xuống đường khi xe đang chạy;"],
  65: ["Điểm d-e khoản 3 Điều 33", "d) Buông cả hai tay; đi xe bằng một bánh đối với xe mô tô, xe gắn máy hai bánh; đi xe bằng hai bánh đối với xe mô tô, xe gắn máy ba bánh; đ) Sử dụng xe để kéo, đẩy xe khác, vật khác, dẫn dắt vật nuôi, mang, vác và chở vật cồng kềnh; chở người đứng trên xe, giá đèo hàng hoặc ngồi trên tay lái; xếp hàng hóa trên xe quá giới hạn quy định; e) Ngồi về một bên điều khiển xe; đứng, nằm trên xe điều khiển xe; thay người lái xe khi xe đang chạy; quay người về phía sau để điều khiển xe hoặc bịt mắt điều khiển xe; sử dụng chân chống hoặc vật khác quệt xuống đường khi xe đang chạy;"],
  66: ["Điểm a-d khoản 4 Điều 33", "a) Mang, vác vật cồng kềnh; b) Sử dụng ô; c) Bám, kéo hoặc đẩy các phương tiện khác; d) Đứng trên yên, giá đèo hàng hoặc ngồi trên tay lái;"],
  67: ["Điểm c khoản 4 Điều 33", "Bám, kéo hoặc đẩy các phương tiện khác;"],
  68: ["Khoản 2 Điều 33", "Người lái xe, người được chở trên xe mô tô hai bánh, xe mô tô ba bánh, xe gắn máy phải đội mũ bảo hiểm theo đúng quy chuẩn kỹ thuật quốc gia và cài quai đúng quy cách."],
  69: ["Khoản 1 Điều 33", "Người lái xe mô tô hai bánh, xe gắn máy chỉ được chở một người, trừ những trường hợp sau thì được chở tối đa hai người: a) Chở người bệnh đi cấp cứu; b) Áp giải người có hành vi vi phạm pháp luật; c) Trẻ em dưới 12 tuổi; d) Người già yếu hoặc người khuyết tật."],
  73: ["Điểm b khoản 4 Điều 33", "Sử dụng ô;"],
  74: ["Điểm c khoản 4 Điều 33", "Bám, kéo hoặc đẩy các phương tiện khác;"],
  77: ["Điểm b khoản 3 Điều 23", "Khi xuống phà, xe cơ giới, xe máy chuyên dùng xuống trước, xe thô sơ, người đi bộ xuống sau; khi lên bến, người đi bộ lên trước, các phương tiện giao thông đường bộ lên sau theo hướng dẫn của người điều khiển giao thông."],
  78: ["Khoản 2 Điều 13", "Trên đường có nhiều làn đường cho xe đi cùng chiều được phân biệt bằng vạch kẻ phân làn đường, người điều khiển phương tiện tham gia giao thông đường bộ phải cho xe đi trong một làn đường và chỉ được chuyển làn đường ở những nơi cho phép; mỗi lần chuyển làn đường chỉ được phép chuyển sang một làn đường liền kề; khi chuyển làn đường phải có tín hiệu báo trước; phải quan sát bảo đảm khoảng cách an toàn với xe phía trước, phía sau và hai bên mới được chuyển làn."],
  79: ["Khoản 3 Điều 13", "Trên một chiều đường có vạch kẻ phân làn đường, xe thô sơ phải đi trên làn đường bên phải trong cùng, xe cơ giới, xe máy chuyên dùng đi trên làn đường bên trái."],
  81: ["Khoản 4 Điều 14", "Khi có xe xin vượt, người điều khiển phương tiện tham gia giao thông đường bộ phía trước phải quan sát phần đường phía trước, nếu đủ điều kiện an toàn thì phải giảm tốc độ, có tín hiệu rẽ phải để báo hiệu cho người điều khiển phương tiện tham gia giao thông đường bộ phía sau biết được vượt và đi sát về bên phải của phần đường xe chạy cho đến khi xe sau đã vượt qua, không được cản trở đối với xe xin vượt."],
  82: ["Khoản 4 Điều 14", "Trường hợp có chướng ngại vật hoặc không đủ điều kiện an toàn thì người điều khiển phương tiện tham gia giao thông đường bộ phía trước có tín hiệu rẽ trái để báo hiệu cho người điều khiển phương tiện tham gia giao thông đường bộ phía sau biết là chưa được vượt."],
  83: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
  84: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
  85: ["Khoản 1 Điều 16", "Khi lùi xe, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát hai bên và phía sau xe, có tín hiệu lùi và chỉ lùi xe khi bảo đảm an toàn."],
  86: ["Khoản 1 Điều 16", "Khi lùi xe, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát hai bên và phía sau xe, có tín hiệu lùi và chỉ lùi xe khi bảo đảm an toàn."],
  87: ["Khoản 1 Điều 17", "Trên đường không phân chia thành hai chiều xe chạy riêng biệt, hai xe đi ngược chiều tránh nhau, người điều khiển phương tiện tham gia giao thông đường bộ phải giảm tốc độ và cho xe đi về bên phải theo chiều xe chạy của mình."],
  88: ["Khoản 2 Điều 17", "Các trường hợp nhường đường khi tránh nhau bao gồm: a) Nơi đường hẹp chỉ đủ cho một xe chạy và có chỗ tránh xe thì xe nào ở gần chỗ tránh hơn phải vào vị trí tránh, nhường đường cho xe đi ngược chiều; b) Xe xuống dốc phải nhường đường cho xe lên dốc; c) Xe có chướng ngại vật phía trước phải nhường đường cho xe không có chướng ngại vật phía trước."],
  89: ["Điểm b khoản 2 Điều 17", "Xe xuống dốc phải nhường đường cho xe lên dốc;"],
  90: ["Điểm c khoản 3 Điều 12", "Chuyển hướng xe chạy hoặc tầm nhìn bị hạn chế;"],
  91: ["Khoản 1 Điều 22", "Tại nơi đường giao nhau giữa đường không ưu tiên với đường ưu tiên hoặc giữa đường nhánh với đường chính thì xe đi từ đường không ưu tiên hoặc đường nhánh phải nhường đường cho xe đi trên đường ưu tiên hoặc đường chính từ bất kỳ hướng nào tới;"],
  92: ["Khoản 3 Điều 22", "Tại nơi đường giao nhau có báo hiệu đi theo vòng xuyến, phải nhường đường cho xe đi đến từ bên trái."],
  93: ["Khoản 2 Điều 22", "Tại nơi đường giao nhau không có báo hiệu đi theo vòng xuyến, phải nhường đường cho xe đi đến từ bên phải."],
  94: ["Khoản 5 Điều 27", "Khi có tín hiệu của xe ưu tiên, người và phương tiện tham gia giao thông đường bộ phải giảm tốc độ, đi sát lề đường bên phải hoặc dừng lại để nhường đường, trạm thu phí phải ưu tiên cho xe ưu tiên qua trạm trong mọi tình huống, không được gây cản trở."],
  95: ["Khoản 4 Điều 27", "Xe ưu tiên quy định tại các điểm a, b, c và d khoản 2 Điều này không bị hạn chế tốc độ; được phép đi không phụ thuộc vào tín hiệu đèn giao thông, đi vào đường ngược chiều, các đường khác có thể đi được; riêng đối với đường cao tốc, chỉ được đi ngược chiều trên làn dừng xe khẩn cấp; phải tuân theo hiệu lệnh của người điều khiển giao thông, biển báo hiệu tạm thời."],
  96: ["Khoản 5 Điều 27", "Khi có tín hiệu của xe ưu tiên, người và phương tiện tham gia giao thông đường bộ phải giảm tốc độ, đi sát lề đường bên phải hoặc dừng lại để nhường đường, trạm thu phí phải ưu tiên cho xe ưu tiên qua trạm trong mọi tình huống, không được gây cản trở."],
  99: ["Khoản 2 Điều 24", "Khi tới đường ngang không có người gác, chắn đường bộ, chuông, đèn tín hiệu, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe và quan sát hai phía, khi không có phương tiện giao thông đường sắt tới mới được đi qua."],
  100: ["Khoản 1 Điều 24", "Khi có hiệu lệnh của nhân viên gác chắn, đèn đỏ sáng nhấp nháy, chuông kêu, chắn đường bộ đang dịch chuyển hoặc đã đóng, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe."],
  101: ["Khoản 3 Điều 24", "Khi phương tiện tham gia giao thông đường bộ bị hư hỏng, bị tai nạn hoặc hàng hóa rơi đổ trên đường ngang, cầu chung đường sắt mà không thể di chuyển ngay khỏi phạm vi an toàn đường sắt, người điều khiển phương tiện tham gia giao thông đường bộ và người có mặt phải ngay lập tức báo hiệu để dừng tàu, thực hiện các biện pháp bảo đảm an toàn."],
  102: ["Khoản 1 Điều 24", "Khi có hiệu lệnh của nhân viên gác chắn, đèn đỏ sáng nhấp nháy, chuông kêu, chắn đường bộ đang dịch chuyển hoặc đã đóng, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe."],
  103: ["Khoản 1 Điều 26", "Xe cơ giới, xe máy chuyên dùng phải bật đèn chiếu gần; xe thô sơ phải bật đèn hoặc có vật phát sáng báo hiệu;"],
  104: ["Điểm b khoản 1 Điều 29", "Việc nối xe kéo với xe được kéo phải bảo đảm chắc chắn, an toàn; trường hợp hệ thống hãm của xe được kéo không còn hiệu lực thì xe kéo nhau phải nối bằng thanh nối cứng;"],
  105: ["Khoản 2 Điều 29", "Xe kéo rơ moóc, xe ô tô đầu kéo chỉ được kéo rơ moóc, sơ mi rơ moóc phù hợp với thiết kế của xe; việc kết nối xe kéo với rơ moóc, xe ô tô đầu kéo với sơ mi rơ moóc phải bảo đảm chắc chắn, an toàn."],
  106: ["Điều 29", "Một xe ô tô chỉ được kéo theo một xe ô tô hoặc xe máy chuyên dùng khác khi xe được kéo không tự chạy được, trừ trường hợp quy định tại khoản 3 Điều 53 của Luật này và phải bảo đảm các quy định sau đây: a) Xe được kéo phải có người điều khiển và hệ thống lái của xe đó phải còn hiệu lực; b) Việc nối xe kéo với xe được kéo phải bảo đảm chắc chắn, an toàn; trường hợp hệ thống hãm của xe được kéo không còn hiệu lực thì xe kéo nhau phải nối bằng thanh nối cứng; c) Phía trước của xe kéo và phía sau của xe được kéo phải có biển báo hiệu, có đèn cảnh báo nhấp nháy màu vàng. 2. Xe kéo rơ moóc, xe ô tô đầu kéo chỉ được kéo rơ moóc, sơ mi rơ moóc phù hợp với thiết kế của xe; việc kết nối xe kéo với rơ moóc, xe ô tô đầu kéo với sơ mi rơ moóc phải bảo đảm chắc chắn, an toàn. 3. Không được chở người trên xe được kéo, trừ người điều khiển; xe kéo rơ moóc, xe ô tô đầu kéo kéo sơ mi rơ moóc không được kéo thêm rơ moóc, sơ mi rơ moóc hoặc xe khác."],
  107: ["Khoản 3 Điều 12", "Người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, giảm tốc độ hoặc dừng lại để bảo đảm an toàn trong các trường hợp sau đây: a) Tại nơi có vạch kẻ đường hoặc báo hiệu khác dành cho người đi bộ hoặc tại nơi mà người đi bộ, xe lăn của người khuyết tật đang qua đường; b) Có báo hiệu cảnh báo nguy hiểm hoặc có chướng ngại vật trên đường; c) Chuyển hướng xe chạy hoặc tầm nhìn bị hạn chế; d) Nơi đường bộ giao nhau cùng mức với đường bộ, đường bộ giao nhau cùng mức với đường sắt; đường hẹp, đường vòng, đường quanh co, đường đèo, dốc; đ) Nơi cầu, cống hẹp, đập tràn, đường ngầm, hầm chui, hầm đường bộ; e) Khu vực có trường học, bệnh viện, bến xe, công trình công cộng tập trung đông người, khu vực đông dân cư, chợ, khu vực đang thi công trên đường bộ, hiện trường vụ tai nạn giao thông đường bộ; g) Có vật nuôi đi trên đường hoặc chăn thả ở ven đường; h) Tránh xe đi ngược chiều hoặc khi cho xe đi phía sau vượt; khi có tín hiệu xin đường, tín hiệu khẩn cấp của xe đi cùng chiều phía trước; i) Điểm dừng xe, đỗ xe trên đường bộ có khách đang lên, xuống xe; k) Gặp xe vận chuyển hàng siêu trường, siêu trọng, hàng hóa nguy hiểm; đoàn người đi bộ; l) Gặp xe ưu tiên; m) Điều kiện trời mưa, gió, sương, khói, bụi, mặt đường trơn trượt, lầy lội, có nhiều đất đá, vật liệu rơi vãi ảnh hưởng đến an toàn giao thông đường bộ; n) Khu vực đang tổ chức kiểm soát giao thông đường bộ."],
  108: ["Khoản 6 Điều 14", "Không được vượt xe trong các trường hợp sau đây: a) Khi không bảo đảm các điều kiện quy định tại khoản 3 Điều này; b) Trên cầu hẹp có một làn đường; c) Đường cong có tầm nhìn bị hạn chế; d) Trên đường hai chiều tại khu vực đỉnh dốc có tầm nhìn bị hạn chế; đ) Nơi đường giao nhau, đường bộ giao nhau cùng mức với đường sắt; e) Khi điều kiện thời tiết hoặc đường không bảo đảm an toàn cho việc vượt; g) Khi gặp xe ưu tiên; h) Ở phần đường dành cho người đi bộ qua đường; i) Khi có người đi bộ, xe lăn của người khuyết tật qua đường; k) Trong hầm đường bộ."],
  109: ["Khoản 2 Điều 14", "Khi vượt các xe phải vượt bên trái; trường hợp khi xe phía trước có tín hiệu rẽ trái hoặc đang rẽ trái hoặc khi xe chuyên dùng đang làm việc trên đường mà không thể vượt bên trái thì được vượt về bên phải."],
  110: ["Khoản 4 Điều 14", "Khi có xe xin vượt, người điều khiển phương tiện tham gia giao thông đường bộ phía trước phải quan sát phần đường phía trước, nếu đủ điều kiện an toàn thì phải giảm tốc độ, có tín hiệu rẽ phải để báo hiệu cho người điều khiển phương tiện tham gia giao thông đường bộ phía sau biết được vượt và đi sát về bên phải của phần đường xe chạy cho đến khi xe sau đã vượt qua, không được cản trở đối với xe xin vượt."],
  111: ["Khoản 3 Điều 25", "Xe máy chuyên dùng có tốc độ thiết kế nhỏ hơn tốc độ tối thiểu quy định đối với đường cao tốc, xe chở người bốn bánh có gắn động cơ, xe chở hàng bốn bánh có gắn động cơ, xe mô tô, xe gắn máy, các loại xe tương tự xe mô tô, xe gắn máy, xe thô sơ, người đi bộ không được đi trên đường cao tốc, trừ người, phương tiện giao thông đường bộ và thiết bị phục vụ việc quản lý, bảo trì đường cao tốc."],
  112: ["Khoản 4 Điều 27", "Xe ưu tiên quy định tại các điểm a, b, c và d khoản 2 Điều này không bị hạn chế tốc độ; được phép đi không phụ thuộc vào tín hiệu đèn giao thông, đi vào đường ngược chiều, các đường khác có thể đi được; riêng đối với đường cao tốc, chỉ được đi ngược chiều trên làn dừng xe khẩn cấp; phải tuân theo hiệu lệnh của người điều khiển giao thông, biển báo hiệu tạm thời."],
  113: ["Khoản 1 Điều 25", "Người lái xe, người điều khiển xe máy chuyên dùng trên đường cao tốc phải tuân thủ quy tắc giao thông đường bộ sau đây: a) Trước khi nhập vào làn đường của đường cao tốc phải có tín hiệu xin vào và phải nhường đường cho xe đang chạy trên đường, quan sát xe phía sau bảo đảm khoảng cách an toàn mới cho xe nhập vào làn đường sát bên phải, nếu có làn đường tăng tốc thì phải cho xe chạy trên làn đường đó trước khi nhập vào làn đường của đường cao tốc; b) Khi chuẩn bị ra khỏi đường cao tốc phải quan sát biển báo hiệu chỉ dẫn, thực hiện chuyển dần sang làn đường sát bên phải, nếu có làn đường giảm tốc thì phải cho xe di chuyển trên làn đường đó trước khi ra khỏi đường cao tốc; c) Không được cho xe chạy ở làn dừng xe khẩn cấp và phần lề đường; d) Các quy tắc giao thông đường bộ khác quy định tại Chương này."],
  114: ["Khoản 2 Điều 25", "Chỉ được dừng xe, đỗ xe ở nơi quy định; trường hợp gặp sự cố kỹ thuật hoặc bất khả kháng khác buộc phải dừng xe, đỗ xe thì được dừng xe, đỗ xe ở làn dừng xe khẩn cấp cùng chiều xe chạy và phải có báo hiệu bằng đèn khẩn cấp; trường hợp xe không thể di chuyển được vào làn dừng xe khẩn cấp, phải có báo hiệu bằng đèn khẩn cấp và đặt biển hoặc đèn cảnh báo về phía sau xe khoảng cách tối thiểu 150 mét, nhanh chóng báo cho cơ quan Cảnh sát giao thông thực hiện nhiệm vụ bảo đảm trật tự, an toàn giao thông trên tuyến hoặc cơ quan quản lý đường cao tốc."],
  115: ["Điểm b khoản 1 Điều 25", "Khi chuẩn bị ra khỏi đường cao tốc phải quan sát biển báo hiệu chỉ dẫn, thực hiện chuyển dần sang làn đường sát bên phải, nếu có làn đường giảm tốc thì phải cho xe di chuyển trên làn đường đó trước khi ra khỏi đường cao tốc;"],
  116: ["Điểm c khoản 1 Điều 25", "Không được cho xe chạy ở làn dừng xe khẩn cấp và phần lề đường;"],
  117: ["Điểm a khoản 1 Điều 25", "Trước khi nhập vào làn đường của đường cao tốc phải có tín hiệu xin vào và phải nhường đường cho xe đang chạy trên đường, quan sát xe phía sau bảo đảm khoảng cách an toàn mới cho xe nhập vào làn đường sát bên phải, nếu có làn đường tăng tốc thì phải cho xe chạy trên làn đường đó trước khi nhập vào làn đường của đường cao tốc;"],
  118: ["Điểm b khoản 1 Điều 59", "Người đủ 18 tuổi trở lên được cấp giấy phép lái xe hạng A1, A, B1, B, C1, được cấp chứng chỉ bồi dưỡng kiến thức pháp luật về giao thông đường bộ để điều khiển xe máy chuyên dùng tham gia giao thông đường bộ;"],
  119: ["Điểm b khoản 1 Điều 59", "Người đủ 18 tuổi trở lên được cấp giấy phép lái xe hạng A1, A, B1, B, C1, được cấp chứng chỉ bồi dưỡng kiến thức pháp luật về giao thông đường bộ để điều khiển xe máy chuyên dùng tham gia giao thông đường bộ;"],
  120: ["Điểm đ khoản 1 Điều 59", "Người đủ 27 tuổi trở lên được cấp giấy phép lái xe hạng D, D1E, D2E, DE;"],
  121: ["Điểm e khoản 1 Điều 59", "Tuổi tối đa của người lái xe ô tô chở người (kể cả xe buýt) trên 29 chỗ (không kể chỗ của người lái xe), xe ô tô chở người giường nằm là đủ 57 tuổi đối với nam, đủ 55 tuổi đối với nữ."],
  122: ["Điểm d khoản 1 Điều 59", "Người đủ 24 tuổi trở lên được cấp giấy phép lái xe hạng D1, D2, C1E, CE;"],
  123: ["Điểm a khoản 1 Điều 59", "Người đủ 16 tuổi trở lên được điều khiển xe gắn máy;"],
  124: ["Điểm a khoản 1 Điều 57", "Hạng A1 cấp cho người lái xe mô tô hai bánh có dung tích xi-lanh đến 125 cm3 hoặc có công suất động cơ điện đến 11 kW;"],
  125: ["Điểm a khoản 1 Điều 57", "Hạng A1 cấp cho người lái xe mô tô hai bánh có dung tích xi-lanh đến 125 cm3 hoặc có công suất động cơ điện đến 11 kW;"],
  126: ["Điểm b khoản 1 Điều 57", "Hạng A cấp cho người lái xe mô tô hai bánh có dung tích xi-lanh trên 125 cm3 hoặc có công suất động cơ điện trên 11 kW và các loại xe quy định cho giấy phép lái xe hạng A1;"],
  127: ["Điểm d khoản 1 Điều 57", "Hạng B cấp cho người lái xe ô tô chở người đến 08 chỗ (không kể chỗ của người lái xe); xe ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế đến 3.500 kg; các loại xe ô tô quy định cho giấy phép lái xe hạng B kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg;"],
  128: ["Điểm đ khoản 1 Điều 57", "Hạng C1 cấp cho người lái xe ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 3.500 kg đến 7.500 kg; các loại xe ô tô tải quy định cho giấy phép lái xe hạng C1 kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg; các loại xe quy định cho giấy phép lái xe hạng B;"],
  129: ["Điểm e khoản 1 Điều 57", "Hạng C cấp cho người lái xe ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 7.500 kg; các loại xe ô tô tải quy định cho giấy phép lái xe hạng C kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg; các loại xe quy định cho giấy phép lái xe hạng B và hạng C1;"],
  130: ["Điểm g khoản 1 Điều 57", "Hạng D1 cấp cho người lái xe ô tô chở người trên 08 chỗ (không kể chỗ của người lái xe) đến 16 chỗ (không kể chỗ của người lái xe); các loại xe ô tô chở người quy định cho giấy phép lái xe hạng D1 kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg; các loại xe quy định cho giấy phép lái xe các hạng B, C1, C;"],
  131: ["Điểm h khoản 1 Điều 57", "Hạng D2 cấp cho người lái xe ô tô chở người (kể cả xe buýt) trên 16 chỗ (không kể chỗ của người lái xe) đến 29 chỗ (không kể chỗ của người lái xe); các loại xe ô tô chở người quy định cho giấy phép lái xe hạng D2 kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg; các loại xe quy định cho giấy phép lái xe các hạng B, C1, C, D1;"],
  132: ["Điểm i khoản 1 Điều 57", "Hạng D cấp cho người lái xe ô tô chở người (kể cả xe buýt) trên 29 chỗ (không kể chỗ của người lái xe); xe ô tô chở người giường nằm; các loại xe ô tô chở người quy định cho giấy phép lái xe hạng D kéo rơ moóc có khối lượng toàn bộ theo thiết kế đến 750 kg; các loại xe quy định cho giấy phép lái xe các hạng B, C1, C, D1, D2;"],
  133: ["Điểm k khoản 1 Điều 57", "Hạng BE cấp cho người lái các loại xe ô tô quy định cho giấy phép lái xe hạng B kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg;"],
  134: ["Điểm m khoản 1 Điều 57", "Hạng CE cấp cho người lái các loại xe ô tô quy định cho giấy phép lái xe hạng C kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg; xe ô tô đầu kéo kéo sơ mi rơ moóc;"],
  135: ["Điểm p khoản 1 Điều 57", "Hạng DE cấp cho người lái các loại xe ô tô quy định cho giấy phép lái xe hạng D kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg; xe ô tô chở khách nối toa."],
  136: ["Khoản 5 Điều 56", "Người tập lái xe ô tô, người dự sát hạch lái xe ô tô khi tham gia giao thông đường bộ phải thực hành trên xe tập lái, xe sát hạch trên tuyến đường tập lái, tuyến đường sát hạch, có giáo viên dạy lái hoặc sát hạch viên bảo trợ tay lái."],
  137: ["Khoản 1 Điều 56", "Người lái xe tham gia giao thông đường bộ phải đủ tuổi, sức khỏe theo quy định của pháp luật; có giấy phép lái xe đang còn điểm, còn hiệu lực phù hợp với loại xe đang điều khiển do cơ quan có thẩm quyền cấp, trừ người lái xe gắn máy quy định tại khoản 4 Điều này."],
  138: ["Khoản 1 Điều 56", "Khi tham gia giao thông đường bộ, người lái xe phải mang theo các giấy tờ sau đây: a) Chứng nhận đăng ký xe hoặc bản sao Chứng nhận đăng ký xe có chứng thực kèm bản gốc giấy tờ xác nhận của tổ chức tín dụng, chi nhánh ngân hàng nước ngoài còn hiệu lực trong trường hợp xe đang được thế chấp tại tổ chức tín dụng, chi nhánh ngân hàng nước ngoài; b) Giấy phép lái xe phù hợp với loại xe đang điều khiển; c) Chứng nhận kiểm định an toàn kỹ thuật và bảo vệ môi trường đối với xe cơ giới theo quy định của pháp luật; d) Chứng nhận bảo hiểm bắt buộc trách nhiệm dân sự của chủ xe cơ giới."],
  139: ["Khoản 5 Điều 62", "Giấy phép lái xe bị thu hồi khi thuộc một trong các trường hợp sau đây: a) Người được cấp giấy phép lái xe không đủ điều kiện sức khỏe theo kết luận của cơ sở khám bệnh, chữa bệnh đối với từng hạng giấy phép lái xe; b) Giấy phép lái xe được cấp sai quy định; c) Giấy phép lái xe đã quá thời hạn tạm giữ hoặc hết thời hiệu thi hành quyết định xử phạt vi phạm hành chính theo quy định của pháp luật về xử lý vi phạm hành chính nếu người vi phạm không đến nhận mà không có lý do chính đáng."],
  140: ["Khoản 2 Điều 58", "Giấy phép lái xe chưa bị trừ hết điểm và không bị trừ điểm trong thời hạn 12 tháng từ ngày bị trừ điểm gần nhất thì được phục hồi đủ 12 điểm."],
  141: ["Khoản 3 Điều 58", "Trường hợp giấy phép lái xe bị trừ hết điểm thì người có giấy phép lái xe không được điều khiển phương tiện tham gia giao thông đường bộ theo giấy phép lái xe đó. Sau thời hạn ít nhất là 06 tháng kể từ ngày bị trừ hết điểm, người có giấy phép lái xe được tham gia kiểm tra nội dung kiến thức pháp luật về trật tự, an toàn giao thông đường bộ theo quy định tại khoản 7 Điều 61 của Luật này do lực lượng Cảnh sát giao thông tổ chức, có kết quả đạt yêu cầu thì được phục hồi đủ 12 điểm."],
  142: ["Điểm c khoản 1 Điều 43", "Tổ chức, cá nhân đứng tên trong giấy chứng nhận đăng ký xe tiếp tục chịu trách nhiệm của chủ xe khi chưa thực hiện thu hồi chứng nhận đăng ký xe, biển số xe đối với trường hợp phải thu hồi theo quy định tại khoản 6 Điều 39 của Luật này;"],
  143: ["Khoản 2 Điều 35", "Xe ô tô kinh doanh vận tải phải lắp thiết bị giám sát hành trình. Xe ô tô chở người từ 08 chỗ trở lên (không kể chỗ của người lái xe) kinh doanh vận tải, xe ô tô đầu kéo, xe cứu thương phải lắp thiết bị giám sát hành trình và thiết bị ghi nhận hình ảnh người lái xe."],
  144: ["Điều 7", "Xe máy chuyên dùng, xe gắn máy và các loại xe tương tự khi tham gia giao thông, tốc độ khai thác tối đa là 40 km/h."],
  145: ["Khoản 1 Điều 6, Bảng 1", "Loại xe cơ giới đường bộ: Các loại xe cơ giới, trừ các xe được quy định tại Điều 7 và Điều 8 Thông tư này. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  146: ["Khoản 1 Điều 6, Bảng 1", "Loại xe cơ giới đường bộ: Các loại xe cơ giới, trừ các xe được quy định tại Điều 7 và Điều 8 Thông tư này. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  147: ["Khoản 1 Điều 6, Bảng 1", "Loại xe cơ giới đường bộ: Các loại xe cơ giới, trừ các xe được quy định tại Điều 7 và Điều 8 Thông tư này. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  148: ["Khoản 1 Điều 6, Bảng 1", "Loại xe cơ giới đường bộ: Các loại xe cơ giới, trừ các xe được quy định tại Điều 7 và Điều 8 Thông tư này. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  149: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe ô tô chở người đến 28 chỗ không kể chỗ của người lái xe (trừ xe buýt); ô tô tải có trọng tải không lớn hơn 3,5 tấn. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 90. Đường hai chiều; đường một chiều có một làn xe cơ giới: 80."],
  150: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe ô tô chở người trên 28 chỗ không kể chỗ người lái xe (trừ xe buýt); ô tô tải có trọng tải trên 3,5 tấn (trừ ô tô xi téc). Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 80. Đường hai chiều; đường một chiều có một làn xe cơ giới: 70."],
  151: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe buýt; ô tô đầu kéo kéo sơ mi rơ moóc (trừ ô tô đầu kéo kéo sơ mi rơ moóc xi téc); xe mô tô; ô tô chuyên dùng (trừ ô tô trộn vữa, ô tô trộn bê tông lưu động). Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 70. Đường hai chiều; đường một chiều có một làn xe cơ giới: 60."],
  152: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Ô tô kéo rơ moóc; ô tô kéo xe khác; ô tô trộn vữa, ô tô trộn bê tông lưu động, ô tô xi téc, ô tô đầu kéo kéo sơ mi rơ moóc xi téc, ô tô kéo theo rơ moóc xi téc. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  153: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe ô tô chở người đến 28 chỗ không kể chỗ của người lái xe (trừ xe buýt); ô tô tải có trọng tải không lớn hơn 3,5 tấn. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 90. Đường hai chiều; đường một chiều có một làn xe cơ giới: 80."],
  154: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe ô tô chở người trên 28 chỗ không kể chỗ người lái xe (trừ xe buýt); ô tô tải có trọng tải trên 3,5 tấn (trừ ô tô xi téc). Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 80. Đường hai chiều; đường một chiều có một làn xe cơ giới: 70."],
  155: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Xe buýt; ô tô đầu kéo kéo sơ mi rơ moóc (trừ ô tô đầu kéo kéo sơ mi rơ moóc xi téc); xe mô tô; ô tô chuyên dùng (trừ ô tô trộn vữa, ô tô trộn bê tông lưu động). Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 70. Đường hai chiều; đường một chiều có một làn xe cơ giới: 60."],
  156: ["Khoản 2 Điều 6, Bảng 2", "Loại xe cơ giới đường bộ: Ô tô kéo rơ moóc; ô tô kéo xe khác; ô tô trộn vữa, ô tô trộn bê tông lưu động, ô tô xi téc, ô tô đầu kéo kéo sơ mi rơ moóc xi téc, ô tô kéo theo rơ moóc xi téc. Tốc độ khai thác tối đa (km/h): Đường đôi; đường một chiều có từ hai làn xe cơ giới trở lên: 60. Đường hai chiều; đường một chiều có một làn xe cơ giới: 50."],
  157: ["Khoản 2 Điều 8", "Xe chở hàng bốn bánh có gắn động cơ khi tham gia giao thông trong phạm vi và thời gian cho phép hoạt động, tốc độ khai thác tối đa là 50 km/h."],
  158: ["Điểm a khoản 2 Điều 11, Bảng 3", "Tốc độ lưu hành (V km/h): 80 < V ≤ 100. Khoảng cách an toàn (m): 70."],
  159: ["Điểm a khoản 2 Điều 11, Bảng 3", "Tốc độ lưu hành (V km/h): 100 < V ≤ 120. Khoảng cách an toàn (m): 100."],
  160: ["Điểm a khoản 2 Điều 11, Bảng 3", "Tốc độ lưu hành (V km/h): 60 < V ≤ 80. Khoảng cách an toàn (m): 55."],
  161: ["Điểm a khoản 2 Điều 11, Bảng 3", "Tốc độ lưu hành (V km/h): V = 60. Khoảng cách an toàn (m): 35."],
  162: ["Điểm a khoản 2 Điều 11", "Khi điều khiển xe chạy với tốc độ dưới 60 km/h, người lái xe, người điều khiển xe máy chuyên dùng phải chủ động giữ khoảng cách an toàn phù hợp với xe chạy liền trước xe của mình; khoảng cách này tùy thuộc vào mật độ phương tiện, tình hình giao thông thực tế để đảm bảo an toàn giao thông."],
  164: ["Khoản 6 Điều 46", "Xe đưa đón trẻ em mầm non, học sinh được ưu tiên trong tổ chức phân luồng, điều tiết giao thông, bố trí nơi dừng xe, đỗ xe tại khu vực trường học và tại các điểm trên lộ trình đưa đón trẻ em mầm non, học sinh."],
  165: ["Khoản 3 Điều 12", "Người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, giảm tốc độ hoặc dừng lại để bảo đảm an toàn trong các trường hợp sau đây: a) Tại nơi có vạch kẻ đường hoặc báo hiệu khác dành cho người đi bộ hoặc tại nơi mà người đi bộ, xe lăn của người khuyết tật đang qua đường; b) Có báo hiệu cảnh báo nguy hiểm hoặc có chướng ngại vật trên đường; c) Chuyển hướng xe chạy hoặc tầm nhìn bị hạn chế; d) Nơi đường bộ giao nhau cùng mức với đường bộ, đường bộ giao nhau cùng mức với đường sắt; đường hẹp, đường vòng, đường quanh co, đường đèo, dốc; đ) Nơi cầu, cống hẹp, đập tràn, đường ngầm, hầm chui, hầm đường bộ; e) Khu vực có trường học, bệnh viện, bến xe, công trình công cộng tập trung đông người, khu vực đông dân cư, chợ, khu vực đang thi công trên đường bộ, hiện trường vụ tai nạn giao thông đường bộ; g) Có vật nuôi đi trên đường hoặc chăn thả ở ven đường; h) Tránh xe đi ngược chiều hoặc khi cho xe đi phía sau vượt; khi có tín hiệu xin đường, tín hiệu khẩn cấp của xe đi cùng chiều phía trước; i) Điểm dừng xe, đỗ xe trên đường bộ có khách đang lên, xuống xe; k) Gặp xe vận chuyển hàng siêu trường, siêu trọng, hàng hóa nguy hiểm; đoàn người đi bộ; l) Gặp xe ưu tiên; m) Điều kiện trời mưa, gió, sương, khói, bụi, mặt đường trơn trượt, lầy lội, có nhiều đất đá, vật liệu rơi vãi ảnh hưởng đến an toàn giao thông đường bộ; n) Khu vực đang tổ chức kiểm soát giao thông đường bộ."],
  166: ["Khoản 1 Điều 12", "Người lái xe, người điều khiển xe máy chuyên dùng phải chấp hành quy định về tốc độ, khoảng cách an toàn tối thiểu với xe phía trước cùng làn đường hoặc phần đường."],
  167: ["Điểm i khoản 3 Điều 12", "Điểm dừng xe, đỗ xe trên đường bộ có khách đang lên, xuống xe;"],
  168: ["Khoản 1 Điều 45", "Việc vận chuyển hành khách bằng xe ô tô phải tuân thủ các quy định sau đây: a) Đón, trả hành khách đúng nơi quy định; hướng dẫn sử dụng trang thiết bị an toàn trên xe; có biện pháp giữ gìn vệ sinh trong xe; b) Vận chuyển hành khách đúng lịch trình, lộ trình đã đăng ký, trừ trường hợp bất khả kháng; c) Không chở hành khách trên nóc xe, trong khoang chở hành lý hoặc để hành khách đu, bám bên ngoài xe; d) Không chở hàng hóa nguy hiểm, hàng hóa cấm lưu hành, hàng lậu, động vật hoang dã, hàng có mùi hôi thối hoặc động vật, hàng hóa khác có ảnh hưởng đến sức khỏe của hành khách, môi trường; đ) Không chở quá số người, chở hành lý, hàng hóa vượt quá khối lượng cho phép hoặc vi phạm quy định khác của pháp luật; e) Không chở hàng hóa trong khoang chở hành khách."],
  170: ["Khoản 15 Điều 9", "Đe dọa, xúc phạm, tranh giành, lôi kéo hành khách; đe dọa, cưỡng ép hành khách sử dụng dịch vụ ngoài ý muốn; chuyển tải, xuống khách hoặc các hành vi khác nhằm trốn tránh phát hiện xe chở quá tải, quá số người theo quy định của pháp luật."],
  171: ["Khoản 1 Điều 64", "Thời gian lái xe của người lái xe ô tô không quá 10 giờ trong một ngày và không quá 48 giờ trong một tuần; lái xe liên tục không quá 04 giờ và bảo đảm các quy định có liên quan của Bộ luật Lao động."],
  172: ["Khoản 1 Điều 64", "Thời gian lái xe của người lái xe ô tô không quá 10 giờ trong một ngày và không quá 48 giờ trong một tuần; lái xe liên tục không quá 04 giờ và bảo đảm các quy định có liên quan của Bộ luật Lao động."],
  173: ["Điểm b khoản 2 Điều 45", "Trước khi cho xe khởi hành phải kiểm tra các điều kiện bảo đảm an toàn của xe, hướng dẫn cho hành khách về an toàn giao thông đường bộ và thoát hiểm khi gặp sự cố;"],
  174: ["Khoản 1 Điều 46", "Xe ô tô kinh doanh vận tải chở trẻ em mầm non, học sinh phải đáp ứng các yêu cầu sau đây: a) Bảo đảm các điều kiện quy định tại khoản 1 và khoản 2 Điều 35 của Luật này; có thiết bị ghi nhận hình ảnh trẻ em mầm non, học sinh và thiết bị có chức năng cảnh báo, chống bỏ quên trẻ em trên xe; có niên hạn sử dụng không quá 20 năm; có màu sơn theo quy định của Chính phủ; b) Xe ô tô chở trẻ em mầm non hoặc học sinh tiểu học phải có dây đai an toàn phù hợp với lứa tuổi hoặc sử dụng xe có ghế ngồi phù hợp với lứa tuổi theo quy định của pháp luật."],
  175: ["Khoản 1 Điều 50", "Việc vận chuyển động vật sống phải bảo đảm các yêu cầu sau đây: a) Người lái xe phải mang đủ giấy tờ theo quy định của pháp luật; b) Phương tiện vận chuyển phải có kết cấu phù hợp với loại động vật chuyên chở; c) Trong quá trình vận chuyển phải chấp hành các quy định của pháp luật về trật tự, an toàn giao thông đường bộ, vệ sinh dịch tễ, phòng dịch và bảo đảm vệ sinh môi trường."],
  176: ["Khoản 2 Điều 51", "Việc vận chuyển hàng hóa nguy hiểm phải có giấy phép vận chuyển; trong trường hợp cần thiết, đơn vị vận chuyển hàng hóa nguy hiểm phải bố trí người áp tải để bảo đảm trật tự, an toàn giao thông đường bộ."],
  177: ["Khoản 3 Điều 55", "Việc lưu hành xe ô tô của người nước ngoài đăng ký tại nước ngoài có tay lái ở bên phải tham gia giao thông tại Việt Nam, xe cơ giới nước ngoài do người nước ngoài đưa vào Việt Nam du lịch được quy định như sau: a) Chấp hành quy định của pháp luật về trật tự, an toàn giao thông đường bộ của Việt Nam. Trường hợp điều ước quốc tế mà nước Cộng hòa xã hội chủ nghĩa Việt Nam là thành viên có quy định khác thì áp dụng theo điều ước quốc tế đó; b) Tham gia giao thông đúng trong phạm vi, tuyến đường, thời gian đã được cơ quan có thẩm quyền của Việt Nam cấp phép; c) Xe ô tô của người nước ngoài đăng ký tại nước ngoài có tay lái ở bên phải phải đi theo đoàn và có người, phương tiện hỗ trợ, hướng dẫn giao thông; d) Tổ chức, cá nhân đưa xe có tay lái ở bên phải vào Việt Nam có trách nhiệm bố trí xe hướng dẫn giao thông, bảo đảm an toàn giao thông khi phương tiện lưu hành trên lãnh thổ Việt Nam."],
  178: ["Khoản 1 Điều 47", "Việc sử dụng xe mô tô, xe gắn máy, xe thô sơ để vận chuyển hành khách, hàng hóa phải thực hiện các quy định sau đây: a) Kiểm tra điều kiện bảo đảm an toàn của xe trước khi tham gia giao thông đường bộ; b) Khi vận chuyển hàng hóa, người lái xe phải mang đủ giấy tờ theo quy định của pháp luật; c) Kiểm tra việc sắp xếp hàng hóa bảo đảm an toàn; không chở quá số người, chở hành lý, hàng hóa vượt quá khối lượng cho phép hoặc vượt quá khổ giới hạn của xe; d) Hàng hóa vận chuyển trên xe phải được sắp xếp gọn gàng và chằng buộc chắc chắn, bảo đảm không gây nguy hiểm cho người và phương tiện tham gia giao thông đường bộ; không cản trở tầm nhìn của người lái xe; không được che khuất đèn, biển số xe; đ) Khi vận chuyển hàng rời, vật liệu xây dựng, phế thải không để rơi vãi xuống đường hoặc gây ra tiếng ồn, bụi bẩn trong suốt quá trình vận chuyển trên đường; e) Khi vận chuyển hàng hóa xếp vượt phía trước và phía sau xe thì ban ngày phải có báo hiệu màu đỏ tại điểm đầu và điểm cuối cùng của hàng hóa, ban đêm hoặc khi trời tối phải có đèn hoặc báo hiệu cho người tham gia giao thông đường bộ để nhận biết."],
  179: ["Khoản 4 Điều 53", "Xe vận chuyển hàng siêu trường, siêu trọng phải chạy với tốc độ quy định trong giấy phép và phải có báo hiệu kích thước của hàng; trường hợp cần thiết, phải có người, phương tiện hỗ trợ theo quy định tại điểm đ khoản 4 Điều 52 của Luật này khi vận chuyển hàng siêu trường, siêu trọng trên đường bộ."],
  180: ["Khoản 2 Điều 54", "Xe cứu hộ giao thông đường bộ phải có dấu hiệu nhận diện, niêm yết thông tin trên xe, gắn thiết bị giám sát hành trình và thiết bị ghi nhận hình ảnh người lái xe theo quy định tại khoản 2 Điều 35 của Luật này."],
  3: ["Khoản 2 Điều 27 Luật Đường bộ số 35/2024/QH15", "Khổ giới hạn của đường bộ là khoảng trống có kích thước giới hạn về chiều rộng, chiều cao của đường bộ để các xe, bao gồm cả hàng hoá xếp trên xe đi qua được an toàn và được xác định theo quy chuẩn, tiêu chuẩn kỹ thuật của đường bộ."],
  4: ["Khoản 7 Điều 24 Luật Đường bộ số 35/2024/QH15", "Dải phân cách được lắp đặt để phân chia phần đường xe chạy thành hai chiều riêng biệt hoặc để phân chia phần đường dành cho xe cơ giới và xe thô sơ hoặc của nhiều loại xe khác nhau trên cùng một chiều đường;"],
  5: ["Khoản 6 Điều 11", "Vạch kẻ đường là vạch chỉ sự phân chia làn đường, vị trí hoặc hướng đi, vị trí dừng lại."],
  16: ["Khoản 1 Điều 44 Luật Đường bộ số 35/2024/QH15", "Đường bộ cao tốc (sau đây gọi là đường cao tốc) là một cấp kỹ thuật của đường bộ, chỉ dành cho một số loại xe cơ giới, xe máy chuyên dùng tham gia giao thông theo quy định của pháp luật, có dải phân cách phân chia hai chiều xe chạy riêng biệt, không giao nhau cùng mức với một hoặc các đường khác, chỉ cho xe ra, vào ở những điểm nhất định, có hàng rào bảo vệ, trang thiết bị phục vụ, bảo đảm giao thông liên tục, an toàn, rút ngắn thời gian hành trình."],
  18: ["Điều 9 Luật Đường bộ số 35/2024/QH15", "Đường chính, đường nhánh, đường gom, đường bên, đường dành cho giao thông công cộng, đường nội bộ, đường dành riêng cho người đi bộ, người đi xe đạp và các đường khác."],
  26: ["Khoản 5 Điều 5 Luật Phòng, chống tác hại của rượu, bia số 44/2019/QH14", "Điều khiển phương tiện giao thông mà trong máu hoặc hơi thở có nồng độ cồn."],
  28: ["Khoản 4 và khoản 5 Điều 9", "4. Xúc phạm, đe dọa, cản trở, chống đối hoặc không chấp hành hiệu lệnh, hướng dẫn, yêu cầu kiểm tra, kiểm soát của người thi hành công vụ về bảo đảm trật tự, an toàn giao thông đường bộ.\n5. Đua xe, tổ chức đua xe, xúi giục, giúp sức, cổ vũ đua xe trái phép; điều khiển phương tiện tham gia giao thông đường bộ lạng lách, đánh võng, rú ga liên tục."],
  30: ["Khoản 16, khoản 20 và khoản 21 Điều 9", "16. Lắp đặt, sử dụng thiết bị âm thanh, ánh sáng trên xe cơ giới, xe máy chuyên dùng gây mất trật tự, an toàn giao thông đường bộ.\n20. Đặt, để chướng ngại vật, vật cản khác trái phép trên đường bộ; rải vật sắc nhọn, đổ chất gây trơn trượt trên đường bộ; làm rơi vãi đất đá, hàng hóa, vật liệu xây dựng, phế thải trên đường bộ; đổ, xả thải, làm rơi vãi hóa chất, chất thải gây mất an toàn giao thông đường bộ.\n21. Cản trở người, phương tiện tham gia giao thông trên đường bộ; ném gạch, đất, đá, cát hoặc vật thể khác vào người, phương tiện đang tham gia giao thông trên đường bộ."],
  45: ["Khoản 4 Điều 14", "Khi có xe xin vượt, người điều khiển phương tiện tham gia giao thông đường bộ phía trước phải quan sát phần đường phía trước, nếu đủ điều kiện an toàn thì phải giảm tốc độ, có tín hiệu rẽ phải để báo hiệu cho người điều khiển phương tiện tham gia giao thông đường bộ phía sau biết được vượt và đi sát về bên phải của phần đường xe chạy cho đến khi xe sau đã vượt qua, không được cản trở đối với xe xin vượt. Trường hợp có chướng ngại vật hoặc không đủ điều kiện an toàn thì người điều khiển phương tiện tham gia giao thông đường bộ phía trước có tín hiệu rẽ trái để báo hiệu cho người điều khiển phương tiện tham gia giao thông đường bộ phía sau biết là chưa được vượt."],
  54: ["Khoản 4 Điều 15", "Không được quay đầu xe ở phần đường dành cho người đi bộ qua đường, trên cầu, đầu cầu, gầm cầu vượt, ngầm, tại nơi đường bộ giao nhau cùng mức với đường sắt, đường hẹp, đường dốc, đoạn đường cong tầm nhìn bị che khuất, trên đường cao tốc, trong hầm đường bộ, trên đường một chiều, trừ khi có hiệu lệnh của người điều khiển giao thông hoặc chỉ dẫn của biển báo hiệu tạm thời."],
  80: ["Khoản 5 Điều 14", "Xe xin vượt phải có báo hiệu nhấp nháy bằng đèn chiếu sáng phía trước hoặc còi, trừ loại xe thô sơ không có đèn chiếu sáng và còi, khi vượt xe phải có tín hiệu báo hướng chuyển, tín hiệu báo hướng chuyển được sử dụng, bảo đảm khoảng cách an toàn với xe phía trước và phía sau trong suốt quá trình vượt xe; trong đô thị và khu đông dân cư trong thời gian từ 22 giờ ngày hôm trước đến 05 giờ ngày hôm sau chỉ được báo hiệu xin vượt bằng đèn."],
  97: ["Khoản 3 và khoản 6 Điều 14", "Xe xin vượt chỉ được vượt khi không có chướng ngại vật phía trước, không có xe chạy ngược chiều trong đoạn đường định vượt, xe chạy trước không có tín hiệu vượt xe khác, đã có tín hiệu rẽ phải và tránh về bên phải.\nKhông được vượt xe trong trường hợp sau đây: a) Khi không bảo đảm các điều kiện quy định tại khoản 3 Điều này; b) Trên cầu hẹp có một làn đường; c) Đường cong có tầm nhìn bị hạn chế; d) Trên đường hai chiều tại khu vực đỉnh dốc có tầm nhìn bị hạn chế; đ) Nơi đường giao nhau, đường bộ giao nhau cùng mức với đường sắt; e) Khi điều kiện thời tiết hoặc đường không bảo đảm an toàn cho việc vượt; g) Khi gặp xe ưu tiên; h) Ở phần đường dành cho người đi bộ qua đường; i) Khi có người đi bộ, xe lăn của người khuyết tật qua đường; k) Trong hầm đường bộ."],
  98: ["Điểm g khoản 6 Điều 14", "Khi gặp xe ưu tiên;"],
  163: ["Điểm b khoản 3 Điều 12", "Có báo hiệu cảnh báo nguy hiểm hoặc có chướng ngại vật trên đường;"],
  169: ["Khoản 14 Điều 9", "Vận chuyển hàng hóa cấm lưu hành, vận chuyển trái phép hoặc không thực hiện đầy đủ các quy định của pháp luật về vận chuyển hàng hóa nguy hiểm, động vật hoang dã."],
  8: ["Điểm a, b, c, d, đ, e, g, h khoản 1 Điều 34", "Xe cơ giới bao gồm:\na) Xe ô tô gồm: xe có từ bốn bánh trở lên chạy bằng động cơ, được thiết kế, sản xuất để hoạt động trên đường bộ, không chạy trên đường ray, dùng để chở người, hàng hóa, kéo rơ moóc, kéo sơ mi rơ moóc hoặc được kết cấu để thực hiện chức năng, công dụng đặc biệt, có thể được nối với đường dây dẫn điện; xe ba bánh có khối lượng bản thân lớn hơn 400 kg; xe ô tô không bao gồm xe chở người bốn bánh có gắn động cơ và xe chở hàng bốn bánh có gắn động cơ;\nb) Rơ moóc là xe không có động cơ để di chuyển, được thiết kế, sản xuất để hoạt động trên đường bộ, được kéo bởi xe ô tô; phần chủ yếu của khối lượng toàn bộ rơ moóc không đặt lên xe kéo;\nc) Sơ mi rơ moóc là xe không có động cơ để di chuyển, được thiết kế, sản xuất để hoạt động trên đường bộ; được kéo bởi xe ô tô đầu kéo và có một phần đáng kể khối lượng toàn bộ đặt lên xe ô tô đầu kéo;\nd) Xe chở người bốn bánh có gắn động cơ là xe có từ bốn bánh trở lên, chạy bằng động cơ, được thiết kế, sản xuất để hoạt động trên đường bộ, có kết cấu để chở người, vận tốc thiết kế không lớn hơn 30 km/h, số người cho phép chở tối đa 15 người (không kể người lái xe);\nđ) Xe chở hàng bốn bánh có gắn động cơ là xe có từ bốn bánh trở lên, chạy bằng động cơ, được thiết kế, sản xuất để hoạt động trên đường bộ, có kết cấu để chở hàng, có phần động cơ và thùng hàng lắp trên cùng một khung xe, có tối đa hai hàng ghế và chở tối đa 05 người (không kể người lái xe), vận tốc thiết kế không lớn hơn 60 km/h và khối lượng bản thân không lớn hơn 550 kg; trường hợp xe sử dụng động cơ điện thì có công suất động cơ không lớn hơn 15 kW;\ne) Xe mô tô gồm: xe có hai hoặc ba bánh chạy bằng động cơ, được thiết kế, sản xuất để hoạt động trên đường bộ, trừ xe gắn máy; đối với xe ba bánh thì khối lượng bản thân không lớn hơn 400 kg;\ng) Xe gắn máy là xe có hai hoặc ba bánh chạy bằng động cơ, được thiết kế, sản xuất để hoạt động trên đường bộ, có vận tốc thiết kế không lớn hơn 50 km/h; nếu động cơ dẫn động là động cơ nhiệt thì dung tích làm việc hoặc dung tích tương đương không lớn hơn 50 cm3; nếu động cơ dẫn động là động cơ điện thì công suất của động cơ không lớn hơn 04 kW; xe gắn máy không bao gồm xe đạp máy;\nh) Xe tương tự các loại xe quy định tại khoản này."],
  9: ["Khoản 2 Điều 34", "Xe thô sơ bao gồm:\na) Xe đạp là xe có ít nhất hai bánh và vận hành do sức người thông qua bàn đạp hoặc tay quay;\nb) Xe đạp máy, gồm cả xe đạp điện, là xe đạp có trợ lực từ động cơ, nguồn động lực từ động cơ bị ngắt khi người lái xe dừng đạp hoặc khi xe đạt tới tốc độ 25 km/h;\nc) Xe xích lô;\nd) Xe lăn dùng cho người khuyết tật;\nđ) Xe vật nuôi kéo;\ne) Xe tương tự các loại xe quy định tại khoản này."],
  70: ["Khoản 3 Điều 33", "Người lái xe mô tô hai bánh, xe mô tô ba bánh, xe gắn máy không được thực hiện các hành vi sau đây: a) Đi xe dàn hàng ngang; b) Đi xe vào phần đường dành cho người đi bộ và phương tiện khác; c) Sử dụng ô, thiết bị âm thanh, trừ thiết bị trợ thính; d) Buông cả hai tay; đi xe bằng một bánh đối với xe mô tô, xe gắn máy hai bánh; đi xe bằng hai bánh đối với xe mô tô, xe gắn máy ba bánh; đ) Sử dụng xe để kéo, đẩy xe khác, vật khác, dẫn dắt vật nuôi, mang, vác và chở vật cồng kềnh; chở người đứng trên xe, giá đèo hàng hoặc ngồi trên tay lái; xếp hàng hóa trên xe quá giới hạn quy định; e) Ngồi về một bên điều khiển xe; đứng, nằm trên xe điều khiển xe; thay người lái xe khi xe đang chạy; quay người về phía sau để điều khiển xe hoặc bịt mắt điều khiển xe; sử dụng chân chống hoặc vật khác quệt xuống đường khi xe đang chạy; g) Hành vi khác gây mất trật tự, an toàn giao thông đường bộ."],
  71: ["Điểm a, b khoản 3 Điều 33", "a) Đi xe dàn hàng ngang; b) Đi xe vào phần đường dành cho người đi bộ và phương tiện khác."],
  72: ["Điểm a, b khoản 3 Điều 33", "a) Đi xe dàn hàng ngang; b) Đi xe vào phần đường dành cho người đi bộ và phương tiện khác."],
  76: ["Khoản 2, điểm c khoản 3 Điều 33", "Người lái xe, người được chở trên xe mô tô hai bánh, xe mô tô ba bánh, xe gắn máy phải đội mũ bảo hiểm theo đúng quy chuẩn kỹ thuật quốc gia và cài quai đúng quy cách.\nSử dụng ô, thiết bị âm thanh, trừ thiết bị trợ thính;"],
  191: ["Khoản 2 Điều 33", "Người lái xe, người được chở trên xe mô tô hai bánh, xe mô tô ba bánh, xe gắn máy phải đội mũ bảo hiểm theo đúng quy chuẩn kỹ thuật quốc gia và cài quai đúng quy cách."],
  194: ["Khoản 1 Điều 80", "Người điều khiển phương tiện tham gia giao thông đường bộ gây ra tai nạn giao thông đường bộ, người liên quan đến vụ tai nạn giao thông đường bộ có trách nhiệm sau đây: a) Dừng ngay phương tiện, cảnh báo nguy hiểm, giữ nguyên hiện trường, trợ giúp người bị nạn và báo tin cho cơ quan Công an, cơ sở khám bệnh, chữa bệnh hoặc Ủy ban nhân dân nơi gần nhất; b) Ở lại hiện trường vụ tai nạn giao thông đường bộ cho đến khi người của cơ quan Công an đến, trừ trường hợp phải đi cấp cứu, đưa người bị nạn đi cấp cứu hoặc xét thấy bị đe dọa đến tính mạng, sức khỏe nhưng phải đến trình báo ngay cơ quan Công an, Ủy ban nhân dân nơi gần nhất; c) Cung cấp thông tin xác định danh tính về bản thân, người liên quan đến vụ tai nạn giao thông đường bộ và thông tin liên quan của vụ tai nạn giao thông đường bộ cho cơ quan có thẩm quyền."],
  195: ["Khoản 2 Điều 80", "Người có mặt tại nơi xảy ra vụ tai nạn giao thông đường bộ có trách nhiệm sau đây: a) Giúp đỡ, cứu chữa kịp thời người bị nạn; b) Báo tin ngay cho cơ quan Công an, cơ sở khám bệnh, chữa bệnh hoặc Ủy ban nhân dân nơi gần nhất; c) Tham gia bảo vệ hiện trường; d) Tham gia bảo vệ tài sản của người bị nạn; đ) Cung cấp thông tin liên quan về vụ tai nạn theo yêu cầu của cơ quan có thẩm quyền."],
  197: ["Khoản 26 Điều 9", "Bỏ trốn sau khi gây tai nạn giao thông đường bộ để trốn tránh trách nhiệm; khi có điều kiện mà cố ý không cứu giúp người bị tai nạn giao thông đường bộ; xâm phạm tính mạng, sức khỏe, tài sản của người bị nạn, người gây tai nạn giao thông đường bộ hoặc người giúp đỡ, cứu chữa, đưa người bị nạn đi cấp cứu; lợi dụng việc xảy ra tai nạn giao thông đường bộ để hành hung, đe dọa, xúi giục, gây sức ép, làm mất trật tự, cản trở việc xử lý tai nạn giao thông đường bộ."],
  198: ["Điểm a khoản 3 Điều 12", "Tại nơi có vạch kẻ đường hoặc báo hiệu khác dành cho người đi bộ hoặc tại nơi mà người đi bộ, xe lăn của người khuyết tật đang qua đường;"],
  199: ["Khoản 1 Điều 80", "Người điều khiển phương tiện tham gia giao thông đường bộ gây ra tai nạn giao thông đường bộ, người liên quan đến vụ tai nạn giao thông đường bộ có trách nhiệm sau đây: a) Dừng ngay phương tiện, cảnh báo nguy hiểm, giữ nguyên hiện trường, trợ giúp người bị nạn và báo tin cho cơ quan Công an, cơ sở khám bệnh, chữa bệnh hoặc Ủy ban nhân dân nơi gần nhất; b) Ở lại hiện trường vụ tai nạn giao thông đường bộ cho đến khi người của cơ quan Công an đến, trừ trường hợp phải đi cấp cứu, đưa người bị nạn đi cấp cứu hoặc xét thấy bị đe dọa đến tính mạng, sức khỏe nhưng phải đến trình báo ngay cơ quan Công an, Ủy ban nhân dân nơi gần nhất; c) Cung cấp thông tin xác định danh tính về bản thân, người liên quan đến vụ tai nạn giao thông đường bộ và thông tin liên quan của vụ tai nạn giao thông đường bộ cho cơ quan có thẩm quyền."],
  201: ["Khoản 20, khoản 21 Điều 9 và khoản 2 Điều 21", "20. Đặt, để chướng ngại vật, vật cản khác trái phép trên đường bộ; rải vật sắc nhọn, đổ chất gây trơn trượt trên đường bộ; làm rơi vãi đất đá, hàng hóa, vật liệu xây dựng, phế thải trên đường bộ; đổ, xả thải, làm rơi vãi hóa chất, chất thải gây mất an toàn giao thông đường bộ.\n21. Cản trở người, phương tiện tham gia giao thông trên đường bộ; ném gạch, đất, đá, cát hoặc vật thể khác vào người, phương tiện đang tham gia giao thông trên đường bộ.\nKhông sử dụng còi liên tục; không sử dụng còi có âm lượng không đúng quy định; không sử dụng còi trong thời gian từ 22 giờ ngày hôm trước đến 05 giờ ngày hôm sau trong khu đông dân cư, khu vực cơ sở khám bệnh, chữa bệnh, trừ xe ưu tiên."],
  248: ["Điểm a khoản 1 Điều 25", "Trước khi nhập vào làn đường của đường cao tốc phải có tín hiệu xin vào và phải nhường đường cho xe đang chạy trên đường, quan sát xe phía sau bảo đảm khoảng cách an toàn mới cho xe nhập vào làn đường sát bên phải, nếu có làn đường tăng tốc thì phải cho xe chạy trên làn đường đó trước khi nhập vào làn đường của đường cao tốc;"],
  249: ["Điểm b khoản 1 Điều 25", "Khi chuẩn bị ra khỏi đường cao tốc phải quan sát biển báo hiệu chỉ dẫn, thực hiện chuyển dần sang làn đường sát bên phải, nếu có làn đường giảm tốc thì phải cho xe di chuyển trên làn đường đó trước khi ra khỏi đường cao tốc;"],
  250: ["Khoản 2 Điều 25", "Chỉ được dừng xe, đỗ xe ở nơi quy định; trường hợp gặp sự cố kỹ thuật hoặc bất khả kháng khác buộc phải dừng xe, đỗ xe thì được dừng xe, đỗ xe ở làn dừng xe khẩn cấp cùng chiều xe chạy và phải có báo hiệu bằng đèn khẩn cấp; trường hợp xe không thể di chuyển được vào làn dừng xe khẩn cấp, phải có báo hiệu bằng đèn khẩn cấp và đặt biển hoặc đèn cảnh báo về phía sau xe khoảng cách tối thiểu 150 mét, nhanh chóng báo cho cơ quan Cảnh sát giao thông thực hiện nhiệm vụ bảo đảm trật tự, an toàn giao thông trên tuyến hoặc cơ quan quản lý đường cao tốc."],
  253: ["Khoản 1 Điều 22", "Tại nơi đường giao nhau giữa đường không ưu tiên với đường ưu tiên hoặc giữa đường nhánh với đường chính thì xe đi từ đường không ưu tiên hoặc đường nhánh phải nhường đường cho xe đi trên đường ưu tiên hoặc đường chính từ bất kỳ hướng nào tới;"],
  254: ["Khoản 6 Điều 9", "Dùng tay cầm và sử dụng điện thoại hoặc thiết bị điện tử khác khi điều khiển phương tiện tham gia giao thông đang di chuyển trên đường bộ."],
  216: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
  217: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
  219: ["Khoản 2 Điều 24", "Khi tới đường ngang không có người gác, chắn đường bộ, chuông, đèn tín hiệu, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe và quan sát hai phía, khi không có phương tiện giao thông đường sắt tới mới được đi qua."],
  225: ["Điểm c khoản 2 Điều 20", "Khi gặp xe đi ngược chiều, trừ trường hợp dải phân cách có khả năng chống chói;"],
  234: ["Khoản 2 Điều 19", "Trước khi mở cửa xe, người mở cửa phải quan sát phía trước, phía sau và bên phía mở cửa xe, khi thấy an toàn mới được mở cửa xe, ra khỏi xe; không để cửa xe mở nếu không bảo đảm an toàn."],
  235: ["Khoản 2 Điều 24", "Khi tới đường ngang không có người gác, chắn đường bộ, chuông, đèn tín hiệu, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe và quan sát hai phía, khi không có phương tiện giao thông đường sắt tới mới được đi qua."],
  236: ["Khoản 2 Điều 24", "Khi tới đường ngang không có người gác, chắn đường bộ, chuông, đèn tín hiệu, người tham gia giao thông đường bộ phải dừng lại về bên phải đường của mình, trước vạch dừng xe và quan sát hai phía, khi không có phương tiện giao thông đường sắt tới mới được đi qua."],
  240: ["Khoản 1, khoản 2 Điều 12; khoản 1 Điều 20", "Người lái xe, người điều khiển xe máy chuyên dùng phải chấp hành quy định về tốc độ, khoảng cách an toàn tối thiểu với xe phía trước cùng làn đường hoặc phần đường.\nNgười điều khiển phương tiện tham gia giao thông đường bộ phải bảo đảm tốc độ phù hợp điều kiện của cầu, đường, mật độ giao thông, địa hình, thời tiết và các yếu tố ảnh hưởng khác để bảo đảm an toàn.\nNgười lái xe, người điều khiển xe máy chuyên dùng tham gia giao thông đường bộ phải bật đèn chiếu sáng phía trước trong thời gian từ 18 giờ ngày hôm trước đến 06 giờ ngày hôm sau hoặc khi có sương mù, khói, bụi, trời mưa, thời tiết xấu làm hạn chế tầm nhìn."],
  246: ["Khoản 1 Điều 16", "Khi lùi xe, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát hai bên và phía sau xe, có tín hiệu lùi và chỉ lùi xe khi bảo đảm an toàn."],
  256: ["Khoản 2 Điều 19", "Trước khi mở cửa xe, người mở cửa phải quan sát phía trước, phía sau và bên phía mở cửa xe, khi thấy an toàn mới được mở cửa xe, ra khỏi xe; không để cửa xe mở nếu không bảo đảm an toàn."],
  257: ["Khoản 2 Điều 15", "Trước khi chuyển hướng, người điều khiển phương tiện tham gia giao thông đường bộ phải quan sát, bảo đảm khoảng cách an toàn với xe phía sau, giảm tốc độ và có tín hiệu báo hướng rẽ hoặc có tín hiệu bằng tay theo hướng rẽ đối với xe thô sơ không có đèn báo hướng rẽ, chuyển dần sang làn gần nhất với hướng rẽ. Tín hiệu báo hướng rẽ hoặc tín hiệu bằng tay phải sử dụng liên tục trong quá trình chuyển hướng. Khi bảo đảm an toàn, không gây trở ngại cho người và phương tiện khác mới được chuyển hướng."],
};
const additionalLawEvidence = {
  205: [burnFirstAidEvidence],
  260: [
    {
      kind: "law-context",
      title: "Văn bản hợp nhất số 55/VBHN-VPQH năm 2026 — Luật Trật tự, an toàn giao thông đường bộ",
      citation: "Khoản 2 Điều 12",
      url: `${consolidatedTrafficLawUrl}#q260-context&page=12`,
      quote: "Người điều khiển phương tiện tham gia giao thông đường bộ phải bảo đảm tốc độ phù hợp điều kiện của cầu, đường, mật độ giao thông, địa hình, thời tiết và các yếu tố ảnh hưởng khác để bảo đảm an toàn."
    },
    {
      kind: "technical-conflict",
      title: "Tư vấn sử dụng xe tay ga (Honda Việt Nam, cập nhật 2021)",
      citation: "Câu hỏi thường gặp: lưu ý khi sử dụng xe tay ga",
      url: "https://www.honda.com.vn/cau-hoi-thuong-gap?category=my-&category_child=tu-van-su-dung-xe-may&category_tab=rung-giat",
      quote: "Khi sử dụng xe, chúng ta cần giữ tốc độ và tay ga ổn định, tránh việc kéo ga hoặc giảm ga một cách đột ngột."
    },
    {
      kind: "technical-conflict",
      title: "Cách tiết kiệm xăng xe máy hiệu quả (Bộ Công Thương)",
      citation: "Mục Giảm ga từ từ, tránh đột ngột",
      url: "https://moit.gov.vn/tin-tuc/su-dung-nang-luong-tiet-kiem-va-hieu-qua/cach-tiet-kiem-xang-xe-may-hieu-qua-khong-phai-ai-cung-biet.html",
      quote: "Đa phần, người đi xe tay ga thường than phiền về tình trạng xe hao, “ngốn” xăng nhiều hơn bình thường. Điều này xuất phát từ cách chạy xe của người dùng.\nTheo đó, để tiết kiệm xăng cho xe tay ga bạn không nên tăng giảm đột ngột, thay vào đó hãy giảm ga từ từ khi gặp các tình huống bất ngờ trên đường."
    }
  ],
  214: [{
    title: "Giáo trình Kỹ thuật lái xe ô tô (Tổng cục Đường bộ Việt Nam, 2018)",
    citation: "Mục 3.3.5, Dừng xe ô tô ở giữa dốc xuống; mục 2.11.3, Phương pháp dừng xe",
    url: drivingTechniqueManualUrl,
    quote: "Khi cần dừng xe ôtô ở giữa dốc xuống (hình 3-10), người lái xe cần thực hiện các thao tác sau:\n- Phát tín hiệu, lái xe sát vào lề đường bên phải;\n- Đạp phanh sớm và mạnh hơn lúc dừng xe trên đường bằng để xe đi với tốc độ chậm đến mức dễ dàng dừng lại được.\n- Về số 1, đạp nửa ly hợp cho xe đến chỗ dừng. Khi xe đã dừng, đạp phanh chân, đạp hết hành trình bàn đạp ly hợp và kéo phanh tay.\n- Sau khi đã kiểm tra an toàn, bật đèn xin đường và từ từ cho xe chuyển vào làn trong cùng bên phải;\n- Đạp hết hành trình bàn đạp ly hợp, tăng lực đạp phanh để dừng xe.\n- Về số 0\n- Kéo phanh tay, để đỗ xe"
  }],
  181: [{
    title: "Tài liệu tập huấn nghiệp vụ vận tải cho lái xe kinh doanh vận tải (Cục Đường bộ Việt Nam, 2025)",
    citation: "Bài 3, mục 3(a), tr. 46 và mục 2, tr. 52",
    url: driverTrainingGuideUrl,
    quote: "Người làm nghề có đạo đức nghề nghiệp sẽ làm cho nghề nghiệp của mình phát triển bền vững, xã hội và đồng nghiệp kính trọng, thu hút được khách hàng, kinh doanh phát triển, đem lại lợi ích cho mình và cho xã hội.\nNgười Lái xe kinh doanh vận tải có vị trí rất quan trọng, tác động lớn đến hiệu quả kinh doanh, uy tín thương hiệu của đơn vị."
  }],
  183: [{
    title: "Tài liệu tập huấn nghiệp vụ vận tải cho lái xe kinh doanh vận tải (Cục Đường bộ Việt Nam, 2025)",
    citation: "Bài 3, mục 3(a), tr. 47 và mục 2, tr. 52",
    url: driverTrainingGuideUrl,
    quote: "Phải yêu xe như con mới quản lý và giữ gìn xe tốt; bảo dưỡng xe đúng quy định để xe sử dụng được lâu bền; chuẩn bị xe chu đáo để xe đi đến nơi về đến chốn, đảm bảo an toàn và đúng thời gian.\nNắm vững các quy định của pháp luật có liên quan đến hoạt động vận tải đường bộ và thực hiện đúng các quy định đó\nLuôn luôn rèn luyện, tu dưỡng bản thân, hình thành tác phong làm việc công nghiệp, không tham gia vào các tệ nạn xã hội, có lối sống lành mạnh. Đối với đồng nghiệp luôn hợp tác, thân tình và giúp đỡ."
  }],
  184: [{
    title: "Tài liệu tập huấn nghiệp vụ vận tải cho lái xe kinh doanh vận tải (Cục Đường bộ Việt Nam, 2025)",
    citation: "Bài 3, mục 3(a), tr. 47–48 và mục 3(a), tr. 53",
    url: driverTrainingGuideUrl,
    quote: "Phải có thái độ lịch sự, tôn trọng, thân mật; Giúp đỡ những người có hoàn cảnh khó khăn, người cao tuổi, người khuyết tật, phụ nữ có thai, có con nhỏ và trẻ em; đảm bảo đầy đủ quyền lợi cho hành khách đi xe và an toàn hàng hóa.\nLuôn luôn rèn luyện, tu dưỡng bản thân, hình thành tác phong làm việc công nghiệp, không tham gia vào các tệ nạn xã hội, có lối sống lành mạnh. Đối với đồng nghiệp luôn hợp tác, thân tình và giúp đỡ.\nGiúp đỡ hành khách khi đi xe, đặc biệt là những người khuyết tật, người cao tuổi, trẻ em và phụ nữ có thai, có con nhỏ, trẻ em."
  }],
  232: [{
    title: "Bộ Công Thương — Xăng sinh học E10: Hiện thực hóa chủ trương lớn của Đảng, Nhà nước",
    citation: "Mục Lợi ích kép: môi trường trong lành và sinh kế nông dân",
    url: moitE10Url,
    quote: "Về môi trường, ethanol trong E10 giúp quá trình cháy sạch và triệt để hơn, giảm các khí thải độc hại như CO, HC, SOx, Nox, những tác nhân gây ô nhiễm không khí đô thị nghiêm trọng."
  }, {
    title: "Thông tư số 02/2025/TT-BKHĐT — Bộ chỉ tiêu thống kê phát triển bền vững của Việt Nam",
    citation: "Chỉ tiêu 7.1.2, khái niệm và ví dụ về nhiên liệu sạch",
    url: cleanFuelStatisticsCircularUrl,
    quote: "Nhiên liệu sạch là loại nhiên liệu có tác động tối thiểu đến môi trường khi được sản xuất, sử dụng, và thải bỏ. Các đặc điểm chính của nhiên liệu sạch bao gồm:\n+ Phát thải thấp: sản sinh ít khí thải độc hại như CO2, Nox, Sox, và các hạt bụi mịn khi đốt cháy.\n+ Tái tạo được: có thể được tái tạo hoặc có nguồn gốc từ các nguồn tài nguyên không cạn kiệt.\n+ Thân thiện với môi trường: Ít gây tác động tiêu cực đến hệ sinh thái và sức khỏe con người.\n+ Hiệu suất năng lượng cao: Có khả năng chuyển hoá năng lượng một cách hiệu quả.\nMột số ví dụ về nhiên liệu sạch bao gồm:\n+ Khí sinh học (biogas): Sản xuất từ quá trình phân hủy sinh học của các vật liệu hữu cơ."
  }],
  233: [
    {
      title: "Tài liệu tập huấn nghiệp vụ vận tải cho lái xe kinh doanh vận tải (Cục Đường bộ Việt Nam, 2025)",
      citation: "Bài 3, mục 3(a), tr. 47",
      url: driverTrainingGuideUrl,
      quote: "Phải yêu xe như con mới quản lý và giữ gìn xe tốt; bảo dưỡng xe đúng quy định để xe sử dụng được lâu bền; chuẩn bị xe chu đáo để xe đi đến nơi về đến chốn, đảm bảo an toàn và đúng thời gian."
    },
    {
      title: "Hướng dẫn sử dụng Hyundai Tucson (2025)",
      citation: "Mục Tire Care",
      url: hyundaiTireManualUrl,
      quote: "For proper maintenance, safety, and maximum fuel economy, always maintain the recommended tire inflation pressures and stay within the load limits and weight distribution recommended for your vehicle."
    },
    {
      title: "Tài liệu tập huấn nghiệp vụ vận tải cho lái xe kinh doanh vận tải (Cục Đường bộ Việt Nam, 2025)",
      citation: "Bài 2, mục II.4, tr. 38",
      url: driverTrainingGuideUrl,
      quote: "Trước khi bắt đầu chuyến hành trình của mình bạn nên lên một lịch trình rõ ràng, vẽ ra những cung đường mình cần di chuyển để đi tới điểm đến một cách thuận lợi nhất. Điều này sẽ giúp bạn chủ động hơn cả khi tham gia giao thông."
    },
    {
      title: "Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15 (đã hợp nhất năm 2026)",
      citation: "Khoản 2 Điều 12",
      url: consolidatedTrafficLawUrl,
      quote: "Người điều khiển phương tiện tham gia giao thông đường bộ phải bảo đảm tốc độ phù hợp điều kiện của cầu, đường, mật độ giao thông, địa hình, thời tiết và các yếu tố ảnh hưởng khác để bảo đảm an toàn."
    }
  ],
  238: [{
    title: "Hướng dẫn sử dụng Hyundai (2026)",
    citation: "Mục Resetting the IMS, bước 1–2",
    url: hyundaiSeatManualUrl,
    quote: "Make sure that the gear is in P (Park) and the engine is ON, and then open the driver's door. Adjust the driver's seat and seatback to the most forward position."
  }],
  272: [{
    title: "Hướng dẫn sử dụng Hyundai Tucson (2025), động cơ diesel",
    citation: "Mục Fuel filter (cartridge) (for diesel engine)",
    url: hyundaiDieselManualUrl,
    quote: "A clogged filter can limit the speed at which the vehicle may be driven, damage the emission system and cause multiple issues such as hard starting."
  }],
  299: [
    {
      title: "Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15 (đã hợp nhất năm 2026)",
      citation: "Khoản 2 Điều 25",
      url: consolidatedTrafficLawUrl,
      quote: "Trong trường hợp gặp sự cố kỹ thuật hoặc bất khả kháng khác buộc phải dừng xe, đỗ xe, người lái xe, người điều khiển xe máy chuyên dùng phải đưa xe vào vị trí dừng xe, đỗ xe khẩn cấp, nếu không di chuyển được, phải có báo hiệu bằng đèn khẩn cấp và đặt biển hoặc đèn cảnh báo về phía sau xe khoảng cách bảo đảm an toàn, nhanh chóng báo cho cơ quan Cảnh sát giao thông thực hiện nhiệm vụ bảo đảm trật tự, an toàn giao thông trên tuyến hoặc cơ quan quản lý hầm đường bộ;"
    },
    {
      title: "QCVN 122:2024/BGTVT — Quy chuẩn kỹ thuật quốc gia về phương tiện giao thông đường bộ",
      citation: "Mục 2, yêu cầu đối với đèn tín hiệu",
      url: qcvn122Url,
      quote: "Các đèn tín hiệu: đèn vị trí (đèn kích thước), đèn báo rẽ (xin đường) và đèn báo nguy hiểm, đèn phanh, đèn lùi, đèn soi biển số"
    }
  ],
  185: [{
    title: "Quyết định 3500/QĐ-BVHTTDL — Tiêu chí Văn hóa giao thông đường bộ",
    citation: "Mục I, tiêu chí chung",
    url: trafficCultureCriteriaUrl,
    quote: "Tự giác chấp hành pháp luật về giao thông; Thực hiện nghiêm nhiệm vụ, tác phong chuẩn mực, văn minh; Tôn trọng, nhường nhịn, giúp đỡ mọi người khi tham gia giao thông; Có trách nhiệm với bản thân và cộng đồng khi tham gia giao thông."
  }],
  204: [{
    title: "Cục Cảnh sát phòng cháy, chữa cháy và cứu nạn, cứu hộ — Khuyến cáo PCCC đối với phương tiện giao thông cơ giới đường bộ",
    citation: "Mục 2, Xử lý khi gặp sự cố cháy xe",
    url: fireVehicleGuidanceUrl,
    quote: "Khi phát hiện thấy có ngọn lửa, khói hoặc nhiệt độ cao bất thường cần bình tĩnh, dừng xe ở lề đường, tránh xa nơi có nhiều người, nhiều chất dễ cháy. Tuỳ thuộc vào tình huống cháy cụ thể mà sử dụng những giải pháp thích hợp để chữa cháy, theo quy trình xử lý sau: Tắt khoá điện, tìm cách khoá bình xăng (nếu có thể);"
  }],
  266: [
    {
      title: "Nghị định 168/2024/NĐ-CP — xử phạt vi phạm về trật tự, an toàn giao thông đường bộ",
      citation: "Điểm c khoản 2 Điều 13",
      url: roadPenaltiesUrl,
      quote: "Điều khiển xe không có bộ phận giảm thanh, giảm khói hoặc có nhưng không có tác dụng, không bảo đảm quy chuẩn môi trường về khí thải, tiếng ồn."
    },
    {
      title: "Nghị định 168/2024/NĐ-CP — xử phạt vi phạm về trật tự, an toàn giao thông đường bộ",
      citation: "Điểm d khoản 2 Điều 14",
      url: roadPenaltiesUrl,
      quote: "Điều khiển xe không có bộ phận giảm thanh, giảm khói hoặc có nhưng không bảo đảm quy chuẩn môi trường về khí thải, tiếng ồn;"
    }
  ],
  454: [{
    title: qcvn41Title,
    citation: 'Phụ lục E, mục E.39, biển số I.436 "Trạm cảnh sát giao thông"',
    url: qcvn41Url,
    quote: 'Để chỉ dẫn nơi đặt trạm cảnh sát giao thông, đặt biển số I.436 "Trạm cảnh sát giao thông". Các phương tiện phải giảm tốc độ đến mức an toàn và không được vượt khi đi qua khu vực này.'
  }],
  242: [{
    title: "Hướng dẫn sử dụng xe mô tô Honda (2025)",
    citation: "Mục Phanh kết hợp, tr. 19",
    url: hondaScooterManualUrl,
    quote: "Để phanh đạt hiệu quả tối ưu, hãy sử dụng đồng thời cả phanh trước và phanh sau."
  }],
  255: [{
    title: "Hướng dẫn sử dụng xe mô tô Honda (2025)",
    citation: "Mục Phanh kết hợp, tr. 19",
    url: hondaScooterManualUrl,
    quote: "Lực phanh được phân bổ tới phanh trước và phanh sau khác nhau khi chỉ sử dụng phanh trước và chỉ sử dụng phanh sau. Để phanh đạt hiệu quả tối ưu, hãy sử dụng đồng thời cả phanh trước và phanh sau."
  }],
  258: [{
    title: "Hướng dẫn sử dụng xe mô tô Honda",
    citation: "Mục Tăng tốc và giảm tốc, tr. 53",
    url: hondaThrottleManualUrl,
    quote: "Để tăng tốc: Tăng ga (vặn tay ga) từ từ. Để giảm tốc: Giảm ga (nhả tay ga)."
  }],
  297: [{
    title: "Nghị định 168/2024/NĐ-CP — xử phạt vi phạm về trật tự, an toàn giao thông đường bộ",
    citation: "Điểm a khoản 2 Điều 13",
    url: roadPenaltiesUrl,
    quote: "dụng cụ thoát hiểm"
  }],
  298: [{
    title: "Nghị định 168/2024/NĐ-CP — xử phạt vi phạm về trật tự, an toàn giao thông đường bộ",
    citation: "Điểm a khoản 2 Điều 13",
    url: roadPenaltiesUrl,
    quote: "thiết bị chữa cháy"
  }],
  188: [firstAidArterialBleedingEvidence],
  196: [firstAidBreathingEvidence],
  207: [automaticStartEvidence],
  218: [trenchCrossingEvidence],
  221: [
    drivingTechniqueEvidence("Mục 2.9.1, Điều khiển cần số", "Yêu cầu: Mắt nhìn thẳng."),
    drivingTechniqueEvidence("Mục 2.12.1, Tăng số", "Cần tăng số theo thứ tự từ thấp đến cao.")
  ],
  222: [
    drivingTechniqueEvidence("Mục 2.9.1, Điều khiển cần số", "Yêu cầu: Mắt nhìn thẳng."),
    drivingTechniqueEvidence("Mục 2.9.1, Điều khiển cần số", "Khi giảm số chủ động thì giảm tuần tự từ cao xuống thấp."),
    drivingTechniqueEvidence("Mục 2.12.2, Giảm số", "Cần giảm số theo thứ tự từ số cao đến số thấp.")
  ],
  290: [automaticStartEvidence],
  230: [seatbeltWarningEvidence],
  231: [lowFuelWarningEvidence],
  271: [maintenancePurposeEvidence],
  275: [fourStrokeEngineEvidence],
  276: [lubricationSystemEvidence],
  279: [engineFunctionEvidence],
  280: [transmissionFunctionEvidence],
  291: [batteryFunctionEvidence],
  292: [alternatorFunctionEvidence],
  293: [seatbeltFunctionEvidence],
  294: [airbagFunctionEvidence],
  295: [steeringAssistWarningEvidence],
  296: [jackToolEvidence],
  300: [ecoModeWarningEvidence],
  208: [parkingBrakeReleaseEvidence],
  209: [manualTransmissionStartEvidence, firstGearStartEvidence, releaseHandbrakeStartEvidence],
  211: [driverSeatingEvidence, steeringWheelPostureEvidence],
  239: [automaticPedalUseEvidence],
  264: [dipstickCheckEvidence],
  281: [clutchFunctionEvidence],
  283: [steeringFunctionEvidence],
  284: [brakeFunctionEvidence],
  282: [gearboxFunctionEvidence],
  227: [parkingBrakeDashboardEvidence],
  228: [oilPressureDashboardEvidence],
  229: [doorDashboardEvidence],
  286: [coolantDashboardEvidence],
  287: [engineDashboardEvidence],
  288: [tirePressureDashboardEvidence],
  289: [absDashboardEvidence],
  267: [carLightingRequirementsEvidence],
  268: [windshieldRequirementEvidence],
  269: [tireRequirementEvidence],
  270: [steeringRequirementEvidence],
  273: [exhaustRequirementEvidence],
  274: [seatBeltRequirementEvidence],
  277: [vehicleAgeEvidence], 278: [vehicleAgeEvidence],
  285: [motorcycleBrakeLightEvidence],
  351: [prohibitedVehicleSignsEvidence],
  352: [distanceAndLengthSignsEvidence], 353: [distanceAndLengthSignsEvidence],
  354: [parkingSignsEvidence], 355: [parkingSignsEvidence],
  356: [distanceAndLengthSignsEvidence], 357: [distanceAndLengthSignsEvidence],
  358: [passengerAndNightSpeedSignsEvidence], 359: [distanceAndLengthSignsEvidence],
  360: [passengerAndNightSpeedSignsEvidence], 361: [residentialAreaSignEvidence],
  362: [speedLimitSignEvidence], 363: [expresswayEndSignEvidence], 364: [speedLimitSignEvidence],
  365: [laneSpeedSignEvidence], 366: [pedestrianAndBicycleSignsEvidence],
  367: [surfaceAndPedestrianWarningEvidence],
  368: [pedestrianAndBicycleSignsEvidence], 369: [pedestrianAndBicycleSignsEvidence],
  370: [intersectionAndPriorityWarningEvidence, railwayAndTunnelWarningEvidence],
  371: [railwayAndTunnelWarningEvidence], 372: [intersectionAndPriorityWarningEvidence],
  373: [railwayAndTunnelWarningEvidence], 374: [railwayAndTunnelWarningEvidence],
  375: [railwayAndTunnelWarningEvidence], 376: [railwayAndTunnelWarningEvidence],
  377: [railwayAndTunnelWarningEvidence], 378: [railwayAndTunnelWarningEvidence],
  379: [railwayAndTunnelWarningEvidence], 380: [priorityAndDividedRoadEvidence],
  381: [intersectionAndPriorityWarningEvidence], 382: [intersectionAndPriorityWarningEvidence],
  383: [intersectionAndPriorityWarningEvidence], 384: [narrowAndTwoWayWarningEvidence],
  385: [narrowAndTwoWayWarningEvidence], 386: [intersectionAndPriorityWarningEvidence],
  387: [intersectionAndPriorityWarningEvidence], 388: [intersectionAndPriorityWarningEvidence],
  389: [narrowAndTwoWayWarningEvidence], 390: [narrowAndTwoWayWarningEvidence],
  391: [priorityAndDividedRoadEvidence], 392: [priorityAndDividedRoadEvidence],
  393: [priorityAndDividedRoadEvidence], 394: [priorityAndDividedRoadEvidence],
  395: [priorityAndDividedRoadEvidence], 396: [narrowAndTwoWayWarningEvidence],
  397: [priorityAndDividedRoadEvidence], 398: [surfaceAndPedestrianWarningEvidence],
  401: [worksiteAndTerrainWarningEvidence], 402: [worksiteAndTerrainWarningEvidence],
  403: [worksiteAndTerrainWarningEvidence], 404: [worksiteAndTerrainWarningEvidence],
  405: [worksiteAndTerrainWarningEvidence], 406: [surfaceAndPedestrianWarningEvidence],
  407: [surfaceAndPedestrianWarningEvidence], 408: [worksiteAndTerrainWarningEvidence],
  409: [surfaceAndPedestrianWarningEvidence], 410: [railwayAndTunnelWarningEvidence],
  411: [surfaceAndPedestrianWarningEvidence], 412: [pedestrianAndBicycleSignsEvidence],
  413: [surfaceAndPedestrianWarningEvidence], 414: [worksiteAndTerrainWarningEvidence],
  415: [worksiteAndTerrainWarningEvidence], 416: [worksiteAndTerrainWarningEvidence],
  417: [dangerousCurveSignEvidence], 418: [worksiteAndTerrainWarningEvidence],
  419: [worksiteAndTerrainWarningEvidence], 420: [worksiteAndTerrainWarningEvidence],
  421: [worksiteAndTerrainWarningEvidence], 422: [worksiteAndTerrainWarningEvidence],
  423: [worksiteAndTerrainWarningEvidence], 424: [worksiteAndTerrainWarningEvidence],
  425: [worksiteAndTerrainWarningEvidence],
  426: [laneSpeedSignEvidence], 427: [laneSpeedSignEvidence],
  428: [roadClassAndLaneGuideEvidence], 429: [roadClassAndLaneGuideEvidence],
  430: [roadClassAndLaneGuideEvidence], 431: [laneAndBusLaneSignsEvidence],
  432: [mandatoryDirectionSignEvidence], 433: [mandatoryDirectionSignEvidence],
  434: [routeAndParkingSignsEvidence], 435: [endAndSpecialSpeedSignsEvidence],
  436: [endAndSpecialSpeedSignsEvidence], 437: [endAndSpecialSpeedSignsEvidence],
  438: [endAndSpecialSpeedSignsEvidence], 439: [endAndSpecialSpeedSignsEvidence],
  440: [routeAndParkingSignsEvidence], 441: [turnaroundAndTurnSignsEvidence],
  442: [noStraightThroughSignEvidence, noLeftRightSignsEvidence],
  443: [routeAndParkingSignsEvidence], 447: [laneAndBusLaneSignsEvidence],
  448: [laneAndBusLaneSignsEvidence], 449: [routeAndParkingSignsEvidence],
  450: [pedestrianGradeSeparationSignEvidence], 451: [pedestrianGradeSeparationSignEvidence],
  452: [routeAndParkingSignsEvidence], 453: [routeAndParkingSignsEvidence],
  455: [intersectionAndPriorityWarningEvidence], 399: [emergencyLaneSignEvidence],
  444: [roadNameSignEvidence], 445: [areaEndSignsEvidence],
  446: [areaEndSignsEvidence], 456: [administrativeBoundarySignsEvidence],
  457: [routeAndParkingSignsEvidence], 458: [laneAndBusLaneSignsEvidence],
  459: [roadClassAndLaneGuideEvidence], 460: [laneAndBusLaneSignsEvidence],
  464: [expresswayEndSignEvidence], 465: [laneMergeSignEvidence],
  466: [laneMergeSignEvidence], 467: [roadClassAndLaneGuideEvidence],
  468: [restAreaServiceSignEvidence], 469: [weightControlSignEvidence],
  470: [obstacleDirectionSignsEvidence], 471: [obstacleDirectionSignsEvidence],
  472: [obstacleDirectionSignsEvidence], 473: [curveArrowMarkerEvidence],
  474: [obstacleDirectionSignsEvidence], 475: [curveArrowMarkerEvidence],
  476: [roadMarkingsEvidence], 477: [roadMarkingsEvidence],
  478: [roadMarkingsEvidence], 479: [roadMarkingsEvidence],
  480: [roadMarkingsEvidence], 481: [roadMarkingsEvidence],
  482: [roadMarkingsEvidence], 483: [distanceMarkerEvidence],
  484: [pedestrianCrossingMarkingEvidence], 485: [roadMarkingsEvidence],
  461: [roadClassAndLaneGuideEvidence], 462: [roadClassAndLaneGuideEvidence],
  463: [roadClassAndLaneGuideEvidence],
  400: [railwayAndTunnelWarningEvidence],
  301: [prohibitedVehicleSignsEvidence], 302: [prohibitedVehicleSignsEvidence],
  303: [vehicleClassSignsEvidence], 304: [prohibitedVehicleSignsEvidence],
  305: [prohibitedVehicleSignsEvidence, vehicleClassSignsEvidence],
  306: [prohibitedVehicleSignsEvidence], 307: [prohibitedVehicleSignsEvidence, vehicleClassSignsEvidence],
  308: [overtakingAndSpeedSignsEvidence], 309: [overtakingAndSpeedSignsEvidence],
  310: [overtakingAndSpeedSignsEvidence], 311: [overtakingAndSpeedSignsEvidence],
  312: [overtakingAndSpeedSignsEvidence],
  313: [turnaroundAndTurnSignsEvidence], 314: [turnaroundAndTurnSignsEvidence],
  315: [turnaroundAndTurnSignsEvidence], 316: [turnaroundAndTurnSignsEvidence],
  317: [turnaroundAndTurnSignsEvidence, noLeftRightSignsEvidence],
  318: [turnaroundAndTurnSignsEvidence, noLeftRightSignsEvidence],
  319: [turnaroundAndTurnSignsEvidence], 320: [turnaroundAndTurnSignsEvidence],
  321: [vehicleClassSignsEvidence], 322: [mandatoryDirectionSignEvidence],
  323: [turnaroundAndTurnSignsEvidence], 324: [turnaroundAndTurnSignsEvidence],
  325: [wrongWaySignEvidence], 326: [closedRoadSignEvidence, wrongWaySignEvidence],
  327: [parkingSignsEvidence], 328: [parkingSignsEvidence],
  329: [stopSignEvidence], 330: [closedRoadSignEvidence],
  331: [prohibitedVehicleSignsEvidence],
  332: [vehicleClassSignsEvidence], 333: [vehicleClassSignsEvidence],
  334: [vehicleClassSignsEvidence], 335: [overtakingAndSpeedSignsEvidence],
  336: [loadLimitSignsEvidence], 337: [loadLimitSignsEvidence],
  338: [loadLimitSignsEvidence], 339: [loadLimitSignsEvidence],
  340: [vehicleClassSignsEvidence], 341: [prohibitedVehicleSignsEvidence],
  342: [vehicleClassSignsEvidence], 343: [vehicleClassSignsEvidence],
  344: [prohibitedVehicleSignsEvidence], 345: [prohibitedVehicleSignsEvidence],
  346: [noLeftRightSignsEvidence], 347: [hornAndTurnSignsEvidence],
  348: [hornAndTurnSignsEvidence], 349: [prohibitedVehicleSignsEvidence, vehicleClassSignsEvidence],
  350: [prohibitedVehicleSignsEvidence, vehicleClassSignsEvidence],
  554: [mandatoryDirectionSignEvidence], 569: [trafficSignalEvidence],
  570: [mandatoryDirectionSignEvidence], 571: [trafficSignalEvidence],
  202: [vehicleFireSafetyEvidence], 203: [fireResponseEvidence],
  259: [mirrorRequirementEvidence], 527: [laneRuleEvidence], 532: [wrongWaySignEvidence],
  543: [mandatoryDirectionSignEvidence], 548: [mandatoryDirectionSignEvidence],
  499: [trafficSignalEvidence], 500: [trafficSignalEvidence], 502: [trafficSignalEvidence],
  503: [trafficSignalEvidence], 528: [trafficSignalEvidence],
  553: [trafficSignalEvidence], 559: [trafficSignalEvidence],
  507: [mandatoryDirectionSignEvidence], 511: [mandatoryDirectionSignEvidence],
  512: [mandatoryDirectionSignEvidence], 514: [mandatoryDirectionSignEvidence],
  519: [mandatoryDirectionSignEvidence], 521: [mandatoryDirectionSignEvidence],
  522: [mandatoryDirectionSignEvidence], 523: [mandatoryDirectionSignEvidence],
  524: [mandatoryDirectionSignEvidence], 526: [mandatoryDirectionSignEvidence],
  529: [mandatoryDirectionSignEvidence], 535: [mandatoryDirectionSignEvidence],
  537: [mandatoryDirectionSignEvidence], 539: [mandatoryDirectionSignEvidence],
  545: [mandatoryDirectionSignEvidence],
  22: [
    {
      title: "Nghị định số 168/2024/NĐ-CP — xử phạt vi phạm hành chính (điều khoản này không thuộc nội dung sửa đổi năm 2026)",
      citation: "Khoản 3 Điều 35",
      url: penaltiesUrl,
      quote: "3. Tịch thu phương tiện đối với người điều khiển phương tiện thực hiện một trong các hành vi vi phạm sau đây: a) Đua xe gắn máy, xe đạp máy, xe đạp trái phép trên đường giao thông; b) Đua xe ô tô, mô tô trái phép trên đường giao thông.",
    },
    {
      title: "Văn bản hợp nhất số 135/VBHN-VPQH — Bộ luật Hình sự",
      citation: "Khoản 1 Điều 266",
      url: criminalCodeUrl,
      quote: "1. Người nào đua trái phép xe ô tô, xe máy hoặc các loại xe khác có gắn động cơ gây thiệt hại cho người khác thuộc một trong các trường hợp sau đây hoặc đã bị xử phạt vi phạm hành chính về hành vi quy định tại Điều này hoặc Điều 265 của Bộ luật này hoặc đã bị kết án về một trong các tội này, chưa được xóa án tích mà còn vi phạm, thì bị phạt tiền từ 10.000.000 đồng đến 50.000.000 đồng, phạt cải tạo không giam giữ đến 02 năm hoặc phạt tù từ 06 tháng đến 03 năm:",
    },
  ],
  23: [
    {
      title: "Nghị định số 168/2024/NĐ-CP, được kiểm tra cùng sửa đổi tại Nghị định số 238/2026/NĐ-CP",
      citation: "Điểm c khoản 11 Điều 6",
      url: penaltiesUrl,
      quote: "11. Phạt tiền từ 30.000.000 đồng đến 40.000.000 đồng đối với người điều khiển xe thực hiện một trong các hành vi vi phạm sau đây: c) Điều khiển xe trên đường mà trong cơ thể có chất ma túy hoặc chất kích thích khác mà pháp luật cấm sử dụng;",
    },
    {
      title: "Nghị định số 168/2024/NĐ-CP, được kiểm tra cùng sửa đổi tại Nghị định số 238/2026/NĐ-CP",
      citation: "Điểm c khoản 15 Điều 6",
      url: penaltiesUrl,
      quote: "c) Thực hiện hành vi quy định tại điểm d, điểm đ, điểm e, điểm g khoản 9; khoản 11 Điều này bị tước quyền sử dụng giấy phép lái xe từ 22 tháng đến 24 tháng.",
    },
  ],
  25: [
    {
      title: "Nghị định số 168/2024/NĐ-CP, được kiểm tra cùng sửa đổi tại Nghị định số 238/2026/NĐ-CP",
      citation: "Điểm a khoản 11 Điều 6",
      url: penaltiesUrl,
      quote: "11. Phạt tiền từ 30.000.000 đồng đến 40.000.000 đồng đối với người điều khiển xe thực hiện một trong các hành vi vi phạm sau đây: a) Điều khiển xe trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 80 miligam/100 mililít máu hoặc vượt quá 0,4 miligam/1 lít khí thở;",
    },
    {
      title: "Nghị định số 168/2024/NĐ-CP, được kiểm tra cùng sửa đổi tại Nghị định số 238/2026/NĐ-CP",
      citation: "Điểm c khoản 15 Điều 6",
      url: penaltiesUrl,
      quote: "c) Thực hiện hành vi quy định tại điểm d, điểm đ, điểm e, điểm g khoản 9; khoản 11 Điều này bị tước quyền sử dụng giấy phép lái xe từ 22 tháng đến 24 tháng.",
    },
  ],
  75: [
    {
      title: "Nghị định số 168/2024/NĐ-CP — xử phạt vi phạm hành chính",
      citation: "Điểm h, i khoản 4 Điều 7",
      url: penaltiesUrl,
      quote: "4. Phạt tiền từ 400.000 đồng đến 600.000 đồng đối với người điều khiển xe thực hiện một trong các hành vi vi phạm sau đây: h) Không đội \"mũ bảo hiểm cho người đi mô tô, xe máy\" hoặc đội \"mũ bảo hiểm cho người đi mô tô, xe máy\" không cài quai đúng quy cách khi điều khiển xe tham gia giao thông trên đường bộ; i) Chở người ngồi trên xe không đội \"mũ bảo hiểm cho người đi mô tô, xe máy\" hoặc đội \"mũ bảo hiểm cho người đi mô tô, xe máy\" không cài quai đúng quy cách, trừ trường hợp chở người bệnh đi cấp cứu, trẻ em dưới 06 tuổi, áp giải người có hành vi vi phạm pháp luật;",
    },
  ],
};

// Some pictured scenarios use the same controlling rule as the matching basic question.
// Keep these explicit so every attached quotation still comes from the primary source table above.
const questionLawAliases = {
  486: [38, 91, 92, 93], 487: [91, 92, 93], 488: [91, 92, 93], 489: [91, 92, 93],
  490: [91, 92, 93], 491: [92], 492: [91], 493: [91, 92, 93], 494: [91, 92, 93],
  495: [91, 92, 93], 496: [91, 92, 93], 497: [91, 92, 93], 498: [91, 92, 93],
  501: [91, 92, 93], 504: [91, 92, 93], 506: [91, 92, 93], 516: [91, 92, 93],
  517: [91, 92, 93], 520: [91, 92, 93], 525: [91, 92, 93], 528: [38],
  533: [91, 92, 93], 534: [91, 92, 93], 536: [91, 92, 93], 538: [91, 92, 93],
  540: [91, 92, 93], 541: [91, 92, 93], 546: [91, 92, 93], 549: [91, 92, 93],
  551: [91, 92, 93], 560: [91, 92, 93], 561: [91, 92, 93], 562: [91, 92, 93],
  563: [91, 92, 93], 565: [91, 92, 93], 566: [91, 92, 93], 567: [91, 92, 93],
  568: [91, 92, 93], 575: [91, 92, 93], 576: [91, 92, 93], 582: [91, 92, 93],
  583: [91, 92, 93], 584: [91, 92, 93], 585: [91, 92, 93], 586: [91, 92, 93],
  588: [91, 92, 93], 589: [91, 92, 93], 591: [91, 92, 93], 593: [91, 92, 93],
  505: [59], 508: [59], 509: [59], 557: [59, 60], 558: [59, 60], 592: [59, 60],
  510: [104, 106], 515: [105], 518: [106],
  513: [108, 109], 530: [108, 109], 531: [108, 109], 552: [48, 109],
  555: [108, 109], 556: [108, 109], 564: [107, 108], 577: [107, 108],
  580: [107, 108], 598: [108, 109], 599: [108, 109],
  542: [55], 544: [56], 547: [56], 550: [55], 578: [58], 579: [58],
  581: [57], 587: [107], 594: [56], 595: [225], 596: [100], 597: [117],
  600: [56, 107],
  554: [mandatoryDirectionSignEvidence], 569: [38], 570: [91], 571: [38],
  572: [56, 107], 573: [56, 107], 574: [91, 107], 590: [43],
  206: [186], 210: [55, 107], 212: [107], 213: [186], 215: [107], 220: [186],
  223: [186], 224: [107], 226: [186, 107], 237: [186, 107], 241: [225, 186],
  243: [107], 244: [240], 245: [240], 247: [107], 251: [108, 109], 252: [186],
  261: [186, 107], 262: [186, 107], 263: [107], 265: [20],
};

const outputPath = path.resolve("src/lib/question-bank-2025.json");
const imageOutput = path.resolve("public/questions");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gplx-bank-"));
const textPath = extractedText || path.join(temp, "bank.txt");
const xmlPath = extractedXml || `${path.join(temp, "bank")}.xml`;
if (!fs.existsSync(textPath)) execFileSync("pdftotext", ["-layout", pdf, textPath]);
if (!fs.existsSync(xmlPath)) execFileSync("pdftohtml", ["-xml", "-hidden", pdf, xmlPath.slice(0, -4)], { stdio: "ignore" });
const xml = fs.readFileSync(xmlPath, "utf8");
const pageCount = [...xml.matchAll(/<page\b/g)].length;
const bboxPath = extractedBbox || path.join(temp, "gplx-word-positions.html");
if (!fs.existsSync(bboxPath)) execFileSync("pdftotext", ["-bbox-layout", pdf, bboxPath]);
const bboxHtml = fs.readFileSync(bboxPath, "utf8");

// pdftohtml's XML omits underline styling because this source PDF draws each
// underline as a vector stroke. Render its non-text layer to page PNGs, then
// associate those strokes with the positioned text lines from the XML.
const formattedPrefix = renderedPagePrefix || path.join(temp, "gplx-formatted");
if (!fs.existsSync(`${formattedPrefix}001.png`)) {
  execFileSync("pdftohtml", ["-c", "-hidden", "-noframes", pdf, formattedPrefix], { stdio: "ignore" });
}
const decodePng = (filename) => {
  const png = fs.readFileSync(filename);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];
  if (bitDepth !== 8 || colorType !== 2) throw new Error(`Unsupported rendered page PNG format: ${bitDepth}-bit type ${colorType}`);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const encoded = inflateSync(Buffer.concat(chunks));
  const stride = width * 3;
  const pixels = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = encoded[y * (stride + 1)];
    const source = encoded.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= 3 ? pixels[row + x - 3] : 0;
      const above = y > 0 ? pixels[row - stride + x] : 0;
      const upperLeft = y > 0 && x >= 3 ? pixels[row - stride + x - 3] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above
        : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft)
          : (() => { throw new Error(`Unsupported PNG filter ${filter}`); })();
      pixels[row + x] = (source[x] + predictor) & 255;
    }
  }
  return { pixels, width, height };
};
const underlineImages = new Map();
for (let page = 1; page <= pageCount; page++) {
  const pngPath = `${formattedPrefix}${String(page).padStart(3, "0")}.png`;
  underlineImages.set(page, decodePng(pngPath));
}

const decodeHtml = (value) => value
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/\s+/g, " ")
  .trim();

const criticalIds = new Set();
for (let page = 1; page <= 25; page++) {
  const html = fs.readFileSync(path.join(indexDirectory, `gplx-index-${page}.html`), "utf8");
  for (const [, id, content] of html.matchAll(/<article id="question-card-(\d+)"([\s\S]*?)<\/article>/g)) {
    if (/Điểm liệt/.test(content)) criticalIds.add(Number(id));
  }
}
if (criticalIds.size !== 60) {
  throw new Error(`Critical-item index integrity check failed: ${criticalIds.size} flags`);
}

const questionsById = new Map();
let current = null;
const text = fs.readFileSync(textPath, "utf8").replace(/\f/g, "\n");
for (const rawLine of text.split(/\r?\n/)) {
  const line = rawLine.trim();
  const heading = line.match(/^Câu\s+(\d+)[.:]\s*(.*)$/i);
  if (heading) {
    current = { id: Number(heading[1]), question: heading[2].trim(), answers: [], activeAnswerIndex: -1 };
    questionsById.set(current.id, current);
    continue;
  }
  if (/^CHƯƠNG\s+/i.test(line)) {
    current = null;
    continue;
  }
  if (!current || !line || /^\d+$/.test(line)) continue;

  const labels = [...line.matchAll(/(?:^|\s{2,})([1-4])\.\s+/g)];
  if (labels.length) {
    for (let index = 0; index < labels.length; index++) {
      const label = labels[index];
      const optionNumber = Number(label[1]);
      const start = label.index + label[0].length;
      const end = labels[index + 1]?.index ?? line.length;
      const value = line.slice(start, end).trim();
      const answerIndex = optionNumber - 1;
      current.answers[answerIndex] = current.answers[answerIndex] ? `${current.answers[answerIndex]} ${value}` : value;
      current.activeAnswerIndex = answerIndex;
    }
    continue;
  }
  if (current.activeAnswerIndex >= 0) current.answers[current.activeAnswerIndex] += ` ${line}`;
  else current.question += ` ${line}`;
}

const normalize = (value) => value.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
  .replace(/[^a-z0-9]/g, "");
const categoryFor = (id) => id <= 180 ? "Quy định chung và quy tắc giao thông đường bộ"
  : id <= 205 ? "Văn hóa giao thông, đạo đức và cứu hộ"
    : id <= 263 ? "Kỹ thuật lái xe"
      : id <= 300 ? "Cấu tạo và sửa chữa"
        : id <= 485 ? "Báo hiệu đường bộ"
          : "Sa hình và xử lý tình huống";

const imageById = new Map();
const sourcePageById = new Map();
let previousQuestionId = null;
for (const page of xml.matchAll(/<page\b[^>]*number="(\d+)"[^>]*>([\s\S]*?)<\/page>/g)) {
  const pageNumber = Number(page[1]);
  const body = page[2];
  const elements = [];
  for (const match of body.matchAll(/<text\b[^>]*top="(\d+)"[^>]*>([\s\S]*?)<\/text>|<image\b[^>]*top="(\d+)"[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*src="([^"]+)"\s*\/>/g)) {
    if (match[2] !== undefined) {
      const words = decodeHtml(match[2]);
      const heading = words.match(/(?:^|\s)Câu\s+(\d+)(?:[.:]|\s*$)/i);
      if (heading) sourcePageById.set(Number(heading[1]), pageNumber);
      elements.push({ top: Number(match[1]), type: "text", id: heading ? Number(heading[1]) : null });
    } else {
      elements.push({ top: Number(match[3]), type: "image", width: Number(match[4]), height: Number(match[5]), src: match[6] });
    }
  }
  elements.sort((a, b) => a.top - b.top);
  let pageQuestionIds = [];
  for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
    const element = elements[elementIndex];
    if (element.type === "text" && element.id) {
      previousQuestionId = element.id;
      pageQuestionIds.push(element.id);
      continue;
    }
    if (element.type === "text") continue;
    if (element.type !== "image") continue;
    const nextId = pageQuestionIds[0];
    const targetId = previousQuestionId ?? nextId;
    if (!targetId || !questionsById.has(targetId)) continue;
    const currentImages = imageById.get(targetId) ?? [];
    const destination = path.join(imageOutput, `question-${targetId}-${currentImages.length + 1}.jpg`);
    fs.mkdirSync(imageOutput, { recursive: true });
    fs.copyFileSync(element.src, destination);
    currentImages.push({ src: `/questions/${path.basename(destination)}`, width: element.width, height: element.height, page: pageNumber });
    imageById.set(targetId, currentImages);
  }
}

const optionLinesById = new Map();
const expectedChoiceById = new Map();
let bboxQuestionId = null;
let bboxPageNumber = 0;
for (const page of bboxHtml.matchAll(/<page\b([^>]*)>([\s\S]*?)<\/page>/g)) {
  bboxPageNumber++;
  const pageWidth = Number(page[1].match(/\bwidth="([\d.]+)"/)?.[1]);
  const scale = 893 / pageWidth;
  for (const lineMatch of page[2].matchAll(/<line\b([^>]*)>([\s\S]*?)<\/line>/g)) {
    const words = [...lineMatch[2].matchAll(/<word\b([^>]*)>([\s\S]*?)<\/word>/g)].map((word) => ({
      text: decodeHtml(word[2]),
      left: Number(word[1].match(/\bxMin="([\d.]+)"/)?.[1]),
      right: Number(word[1].match(/\bxMax="([\d.]+)"/)?.[1]),
    }));
    const lineText = words.map((word) => word.text).join(" ");
    const heading = lineText.match(/(?:^|\s)Câu\s+(\d+)(?:[.:]|\s|$)/i);
    if (heading) bboxQuestionId = Number(heading[1]);
    if (!bboxQuestionId) continue;

    const labels = words.map((word, index) => ({
      ...word,
      index,
      match: word.text.match(/^([1-4])[.)]?$/),
      separateChoice: index === 0 || word.left - words[index - 1].right > 20,
    })).filter((word) => word.match && word.separateChoice);
    for (let index = 0; index < labels.length; index++) {
      const label = labels[index];
      const choiceNumber = Number(label.match[1]);
      const expectedChoice = expectedChoiceById.get(bboxQuestionId) ?? 1;
      if (choiceNumber !== expectedChoice) continue;
      const lastWordIndex = labels[index + 1] ? labels[index + 1].index - 1 : words.length - 1;
      const lastWord = words[Math.max(label.index, lastWordIndex)];
      const attrs = lineMatch[1];
      const yTop = Number(attrs.match(/\byMin="([\d.]+)"/)?.[1]);
      const yBottom = Number(attrs.match(/\byMax="([\d.]+)"/)?.[1]);
      const options = optionLinesById.get(bboxQuestionId) ?? [[], [], [], []];
      options[choiceNumber - 1].push({
        page: bboxPageNumber,
        left: Math.floor(label.left * scale),
        top: Math.floor(yTop * scale),
        width: Math.ceil(lastWord.right * scale) - Math.floor(label.left * scale),
        height: Math.ceil((yBottom - yTop) * scale),
      });
      optionLinesById.set(bboxQuestionId, options);
      expectedChoiceById.set(bboxQuestionId, expectedChoice + 1);
    }
  }
}

const hasUnderline = (line) => {
  const image = underlineImages.get(line.page);
  if (!image || line.top >= image.height || line.width <= 0) return false;
  const x0 = Math.max(0, line.left);
  const x1 = Math.min(image.width, line.left + line.width);
  const minRun = Math.min(12, Math.max(5, Math.round(line.width * 0.2)));
  for (const y of [line.top + line.height - 3, line.top + line.height - 2, line.top + line.height - 1]) {
    if (y < 0 || y >= image.height) continue;
    let run = 0;
    for (let x = x0; x < x1; x++) {
      const pixel = (y * image.width + x) * 3;
      if (image.pixels[pixel] < 64 && image.pixels[pixel + 1] < 64 && image.pixels[pixel + 2] < 64) {
        if (++run >= minRun) return true;
      } else run = 0;
    }
  }
  return false;
};

const underlinedAnswerById = new Map();
for (let id = 1; id <= 600; id++) {
  const optionLines = optionLinesById.get(id) ?? [];
  const marked = optionLines.map((lines) => lines.filter((line) => hasUnderline(line)).length > 0);
  const matches = marked.map((value, index) => value ? index : -1).filter((index) => index >= 0);
  if (matches.length !== 1) {
    const debug = optionLines.map((lines, index) => `${index + 1}:${lines.filter((line) => hasUnderline(line)).map((line) => `${line.page}@${line.top}+${line.height},x${line.left}`).join("/")}`).filter((entry) => !entry.endsWith(":"));
    throw new Error(`PDF underline integrity check failed for Q${id}: ${matches.length} underlined choices (${debug.join("; ")})`);
  }
  underlinedAnswerById.set(id, matches[0]);
}

const studyExplanations = {
  260: "• Tăng ga từ từ: Để đảm bảo bạn kiểm soát tốc độ xe máy trong tầm kiểm soát của bạn.\n• Giảm ga thật nhanh: Để đảm bảo quá trình giảm tốc độ khi gặp chướng ngại vật hoặc cần phanh xe để đảm bảo an toàn.",
};

const questions = [];
const errors = [];
for (let id = 1; id <= 600; id++) {
  const source = questionsById.get(id);
  if (!source || !source.question || source.answers.length < 2) {
    errors.push(`Q${id}: missing question or choices (${source?.answers.length ?? 0})`);
    continue;
  }
  if (!sourcePageById.has(id)) {
    errors.push(`Q${id}: missing official PDF page reference`);
    continue;
  }
  const correct = underlinedAnswerById.get(id);
  questions.push({
    id,
    category: categoryFor(id),
    question: source.question.replace(/\s+/g, " ").trim(),
    answers: source.answers.map((answer) => answer.replace(/\s+/g, " ").trim()),
    correct,
    critical: criticalIds.has(id),
    images: imageById.get(id) ?? [],
    ...(studyExplanations[id] ? { explanation: studyExplanations[id] } : {}),
    evidence: [
      {
        kind: "official-exam-bank",
        title: "Bộ 600 câu hỏi dùng cho sát hạch lái xe cơ giới đường bộ",
        citation: `Câu ${id}, trang ${sourcePageById.get(id)}`,
        url: `${officialPdf}#page=${sourcePageById.get(id)}`,
        quote: source.answers[correct],
      },
      ...(questionLawAliases[id] ?? [id]).flatMap((sourceId) => {
        const sourceQuote = trafficLawQuotes[sourceId];
        if (!sourceQuote) return [];
        return (Array.isArray(sourceQuote[0]) ? sourceQuote : [sourceQuote]).map(([citation, quote]) => ({
          kind: "law",
          title: speedRegulationIds.has(sourceId) ? "Thông tư 38/2024/TT-BGTVT — tốc độ và khoảng cách an toàn"
            : roadLawIds.has(sourceId) ? "Luật Đường bộ số 35/2024/QH15"
              : alcoholLawIds.has(sourceId) ? "Luật Phòng, chống tác hại của rượu, bia số 44/2019/QH14"
                : "Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15",
          citation,
          url: speedRegulationIds.has(sourceId) ? speedRegulationUrl
            : roadLawIds.has(sourceId) ? roadLawUrl
              : alcoholLawIds.has(sourceId) ? alcoholLawUrl
                : trafficLawContinuationIds.has(sourceId) ? trafficLawContinuationUrl
                  : trafficLawUrl,
          quote,
        }));
      }),
      ...(additionalLawEvidence[id] ?? []).map((item) => ({ kind: item.kind ?? "law", ...item })),
    ],
  });
}

if (errors.length || questions.length !== 600) {
  throw new Error(`Import aborted: ${questions.length}/600 questions; ${errors.length} errors\n${errors.slice(0, 20).join("\n")}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  source: "Cục Cảnh sát giao thông, Bộ Công an — Bộ 600 câu hỏi dùng cho sát hạch lái xe cơ giới đường bộ (Hà Nội, 2025), ban hành kèm Công văn 2262/CSGT-P5 ngày 07/05/2025.",
  officialGuidance: "https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-bo-600-cau-hoi-dung-de-sat-hach-lai-xe-co-gioi-duong-bo-119250513110514585.htm",
  note: "Question wording, choices, diagrams, and correct answers are transcribed from the 2025 CSGT bank PDF. Correct choices are detected from the PDF's underlined answer marks. Each question includes the exact official-bank answer excerpt; statutory excerpts appear only where individually verified against an official source current as checked on 2026-10-02. The official-bank answer excerpt is not itself a legal basis. Q260 includes a supplementary study explanation, not a quotation from law or the official bank.",
  questions,
}, null, 2)}\n`);
console.log(`Imported ${questions.length} questions using PDF underlines, ${criticalIds.size} critical items, ${[...imageById.values()].reduce((n, images) => n + images.length, 0)} question images.`);
