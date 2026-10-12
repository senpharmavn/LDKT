# LDKT — ngữ cảnh riêng

Đọc PROJECT_BRIEF.md.txt, app/README.md và hướng dẫn bên trong app trước code. app/AGENTS.md có quy tắc phiên bản Next.js riêng; giữ và tuân thủ, không ghi đè. README có thể cũ: kiểm chứng code, API/schema và deployment notes trước kết luận hệ thống đang live.

Với Sheet/Apps Script, đọc ship-sheet-backed-webapps và trace Sheet → API → mapper → derived state → UI. Ngày mở/kết thúc khác trạng thái hoàn thành; dữ liệu server sau fetch thành công có thẩm quyền hơn cache local; giữ ranh giới cohort. Không mang kiến trúc SEN vào LDKT. Local Code.gs khác bản đã deploy. Chỉ deploy/ghi dữ liệu ngoài khi nhiệm vụ cho phép và kiểm chứng luồng thật theo mức rủi ro.
