# VietRecipe Frontend — Architecture & Delivery Roadmap

> Tài liệu này là nguồn sự thật duy nhất khi xây dựng frontend. Mỗi phase chỉ được chuyển sang `DONE` sau khi toàn bộ checklist và exit criteria đã hoàn thành.

## 1. Trạng thái dự án

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Dọn scaffold và chuẩn hóa nền tảng | `DONE` |
| 1 | Application shell, routing và layouts | `NOT_STARTED` |
| 2 | API client, auth và session | `NOT_STARTED` |
| 3 | Public recipe experience | `NOT_STARTED` |
| 4 | Recipe authoring và moderation | `NOT_STARTED` |
| 5 | User features | `NOT_STARTED` |
| 6 | Cooking mode và cooking history | `NOT_STARTED` |
| 7 | Admin experience | `NOT_STARTED` |
| 8 | Quality gate và FE handoff | `NOT_STARTED` |

Trạng thái hợp lệ:

```text
NOT_STARTED → IN_PROGRESS → DONE
                     ↘ BLOCKED
```

Quy tắc cập nhật:

1. Khi bắt đầu phase, đổi trạng thái sang `IN_PROGRESS`.
2. Nếu không thể tiếp tục, đổi sang `BLOCKED` và ghi blocker ngay trong phase.
3. Chỉ đổi sang `DONE` khi build, test và exit criteria đều đạt.
4. Không đánh dấu `DONE` dựa trên giao diện mock hoặc dữ liệu hard-code.
5. Sau mỗi phase nên tạo một commit riêng.

## 2. Mục tiêu và nguyên tắc

- Xây dựng SPA bằng React + Vite, sử dụng backend Express hiện có.
- Không sử dụng mock recipe, mock user hoặc mock API response trong code production.
- API trả mảng rỗng thì hiển thị `EmptyState`; không tự tạo dữ liệu thay thế.
- API đang tải thì hiển thị skeleton có hình dạng gần với nội dung thật.
- API lỗi thì hiển thị `ErrorState` và hành động thử lại phù hợp.
- UI chỉ hiển thị dữ liệu đã có và đã được kiểm tra an toàn.
- State phải tối thiểu; không lưu lại dữ liệu có thể suy ra từ props, URL hoặc state khác.
- Không thêm Redux, query library hoặc design system package trước khi có nhu cầu thực tế.
- Mỗi feature tự sở hữu page, component, API adapter và test của nó.
- Accessibility, responsive layout và keyboard navigation là yêu cầu cơ bản.

## 3. Các quyết định kiến trúc

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Build tool | Vite | Nhẹ, đã có trong project và hỗ trợ React tốt |
| Router | React Router Data Mode | Có loader, action, route error và pending state |
| API | Wrapper mỏng quanh `fetch` | Không thêm dependency khi native API đã đủ |
| Server state | Route loader + local component state | Phù hợp quy mô portfolio, tránh cache abstraction sớm |
| Auth state | `AuthProvider` | Chỉ session hiện tại cần chia sẻ toàn app |
| Theme state | `ThemeProvider` + `localStorage` | Theme là client preference, đồng bộ profile sau login |
| Styling | CSS modules hoặc CSS theo component | Không thêm UI framework trước khi có thiết kế ổn định |
| Forms | Native form state trước | Chỉ thêm form library nếu form recipe trở nên khó kiểm soát |
| Skeleton | Component theo layout | Tránh spinner chung không phản ánh bố cục trang |
| Mock data | Không sử dụng | Empty state phải phản ánh đúng dữ liệu backend |

## 4. Cấu trúc thư mục chuẩn

```text
frontend/
├── docs/
│   └── FRONTEND_ROADMAP.md
├── public/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── providers.jsx
│   ├── assets/
│   ├── components/
│   │   ├── feedback/
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── LoadingButton.jsx
│   │   │   └── PageSkeleton.jsx
│   │   ├── navigation/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── recipes/
│   │   ├── catalog/
│   │   ├── collections/
│   │   ├── meal-plans/
│   │   ├── cooking/
│   │   ├── preferences/
│   │   └── admin/
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   ├── AuthLayout.jsx
│   │   ├── UserLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── lib/
│   │   ├── apiClient.js
│   │   ├── env.js
│   │   └── storage.js
│   ├── pages/
│   │   ├── errors/
│   │   └── legal/
│   ├── providers/
│   │   ├── AuthProvider.jsx
│   │   └── ThemeProvider.jsx
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── globals.css
│   │   └── skeleton.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

Quy tắc đặt code:

- Component chỉ dùng trong một feature phải nằm trong feature đó.
- `components/ui` chỉ chứa component thật sự dùng chung từ hai feature trở lên.
- API endpoint của feature nằm cùng feature, ví dụ `features/recipes/recipeApi.js`.
- Không tạo `utils/` chung chung; helper phải có tên thể hiện trách nhiệm.
- Không để toàn bộ router, page và component trong `main.jsx`.
- Không tạo barrel export nếu chưa giúp giảm import phức tạp.

## 5. Layout theo nhóm trang

### PublicLayout

Thành phần:

- Header và public navigation.
- Search entry.
- Theme switcher.
- Login/register hoặc user menu.
- `<Outlet />`.
- Footer.

Áp dụng:

```text
/
/recipes
/recipes/:slug
/search
/terms
/privacy
```

### AuthLayout

Thành phần:

- Logo và link về Home.
- Khung form tập trung.
- Không hiển thị navigation phức tạp.
- `<Outlet />`.

Áp dụng:

```text
/login
/register
/forgot-password
/reset-password
```

### UserLayout

Thành phần:

- Header đã đăng nhập.
- User navigation hoặc sidebar responsive.
- Session guard.
- `<Outlet />`.

Áp dụng:

```text
/dashboard
/profile
/preferences
/settings
/recipes/new
/recipes/:id/edit
/recipes/:id/cook
/collections
/collections/:id
/meal-plan
/cooking-history
```

### AdminLayout

Thành phần:

- Admin sidebar.
- Breadcrumb.
- Role guard cho `EDITOR` hoặc `ADMIN`.
- `<Outlet />`.

Áp dụng:

```text
/admin
/admin/moderation
/admin/audit-logs
```

## 6. Data states bắt buộc

Mỗi page gọi API phải xử lý đủ bốn trạng thái:

```text
loading → success with data
        → success without data
        → error
```

### Loading

- Hiển thị skeleton ngay trong vùng nội dung sẽ xuất hiện.
- Giữ nguyên kích thước gần đúng để hạn chế layout shift.
- Không dùng text “Loading...” làm loading state chính.
- Mutation phải disable nút submit và hiển thị trạng thái đang xử lý.

### Success with data

- Render dữ liệu thật từ backend.
- Không dùng fallback thành recipe hoặc user giả.
- Field optional thiếu thì ẩn block tương ứng hoặc dùng nhãn trung tính như “Chưa cập nhật”.

### Success without data

- Render `EmptyState` đúng ngữ cảnh.
- Ví dụ: “Chưa có công thức được xuất bản” hoặc “Bạn chưa có collection”.
- Chỉ có CTA khi user thực sự có thể thực hiện hành động đó.

### Error

- Lỗi network/5xx: hiển thị retry.
- `401`: thử refresh session một lần; thất bại thì về login.
- `403`: hiển thị Forbidden page.
- `404`: hiển thị Not Found page.
- Validation error: hiển thị lỗi cạnh field tương ứng nếu backend có details.
- Không hiển thị stack trace hoặc message nội bộ cho người dùng.

## 7. Skeleton system

Skeleton chung:

```text
SkeletonBlock
SkeletonText
SkeletonAvatar
SkeletonButton
```

Skeleton theo trang:

| Trang | Skeleton bắt buộc |
|---|---|
| Home | Hero + 3 recipe cards |
| Recipe list/search | Filter row + grid recipe cards |
| Recipe detail | Image + title + metadata + ingredients + steps |
| Dashboard | Summary cards + recent collections + meal plan |
| Collections | Collection card grid |
| Collection detail | Heading + recipe card grid |
| Meal plan | 7 day columns hoặc mobile list |
| Cooking history | History rows + thumbnail |
| Admin moderation | Table rows hoặc moderation cards |
| Profile/preferences | Form labels + controls |

Accessibility:

- Skeleton container dùng `aria-busy="true"`.
- Vùng cập nhật dùng `aria-live="polite"` khi phù hợp.
- Skeleton chỉ mang tính trình bày nên dùng `aria-hidden="true"` cho các block con.
- Tôn trọng `prefers-reduced-motion` và tắt shimmer animation khi người dùng yêu cầu giảm chuyển động.

## 8. API client contract

Biến môi trường:

```text
VITE_API_URL=http://localhost:3000/api/v1
```

`apiClient` chịu trách nhiệm:

- Ghép base URL và path.
- Gửi JSON headers.
- Gửi `credentials: "include"` để refresh cookie hoạt động.
- Thêm access token vào `Authorization` khi có.
- Parse response envelope `{ data, meta }`.
- Parse error envelope `{ error }`.
- Gắn `requestId` vào object lỗi để debug.
- Thử refresh token tối đa một lần khi nhận `401`.
- Không tự retry mutation.
- Hỗ trợ `AbortSignal` để hủy request khi route thay đổi.

Không được:

- Hard-code base URL trong page.
- Gọi `fetch` rải rác trong JSX.
- Lưu refresh token trong `localStorage`.
- Nuốt lỗi và trả dữ liệu rỗng giả.

## 9. Authentication và authorization

Session model:

- Access token giữ trong memory.
- Refresh token do backend quản lý bằng HttpOnly cookie.
- App bootstrap gọi refresh hoặc `/auth/me` để phục hồi session.
- `AuthProvider` cung cấp `user`, `accessToken`, `status`, `login`, `logout`.
- `ProtectedRoute` yêu cầu user đã đăng nhập.
- `RoleRoute` kiểm tra `EDITOR` hoặc `ADMIN`.
- Backend vẫn là nguồn kiểm tra quyền cuối cùng; frontend guard chỉ phục vụ UX.

Auth status:

```text
checking | authenticated | anonymous
```

Trong trạng thái `checking`, render application shell skeleton thay vì nháy trang login.

## 10. Page inventory

### Public

| Page | Route | Dữ liệu chính |
|---|---|---|
| Home | `/` | Recipe published nổi bật hoặc empty state |
| Browse recipes | `/recipes` | Recipe list, pagination, filters |
| Search results | `/search` | Recipe list theo query URL |
| Recipe detail | `/recipes/:slug` | Recipe, rating, comments |
| Terms | `/terms` | Static content |
| Privacy | `/privacy` | Static content |

### Authentication

| Page | Route | Ghi chú |
|---|---|---|
| Login | `/login` | Email/password |
| Register | `/register` | Display name/email/password |
| Forgot password | `/forgot-password` | Chỉ triển khai khi backend có endpoint |
| Reset password | `/reset-password` | Chỉ triển khai khi backend có endpoint |

### User

| Page | Route | Dữ liệu chính |
|---|---|---|
| Dashboard | `/dashboard` | Preferences, collections, meal plan |
| Profile | `/profile` | User hiện tại |
| Preferences | `/preferences` | Theme, locale, diet, difficulty |
| Settings | `/settings` | Session/account actions hiện có |
| Create recipe | `/recipes/new` | Catalog + recipe form |
| Edit recipe | `/recipes/:id/edit` | Owner recipe + catalog |
| Cooking mode | `/recipes/:id/cook` | Recipe steps |
| Collections | `/collections` | User collections |
| Collection detail | `/collections/:id` | Recipes trong collection |
| Meal plan | `/meal-plan` | Meal plan theo tuần |
| Cooking history | `/cooking-history` | Cooking logs + photos |

### Admin

| Page | Route | Quyền |
|---|---|---|
| Admin dashboard | `/admin` | `EDITOR`, `ADMIN` |
| Moderation queue | `/admin/moderation` | `EDITOR`, `ADMIN` |
| Audit logs | `/admin/audit-logs` | `ADMIN` |

### Error

```text
401 Unauthorized
403 Forbidden
404 Not Found
500 Unexpected Error
Offline / Network unavailable
```

## 11. Phase 0 — Dọn scaffold và chuẩn hóa nền tảng

Trạng thái: `DONE`

Mục tiêu: loại bỏ scaffold thử nghiệm và tạo nền tảng không có mock data.

Checklist:

- [x] Đổi phase sang `IN_PROGRESS`.
- [x] Xóa mảng `recipes` hard-code khỏi `src/main.jsx`.
- [x] Xóa recipe detail hard-code.
- [x] Xóa các placeholder page không phản ánh data state thật.
- [x] Tách `App`, router, provider và global styles khỏi `main.jsx`.
- [x] Thêm `vite.config.js` với React plugin.
- [x] Pin version dependency, không dùng `latest` trong `package.json`.
- [x] Tạo `tokens.css` và `globals.css`.
- [x] Bảo đảm `.env` và build output không được commit.
- [x] Chạy `npm run build`.
- [x] Đổi phase sang `DONE`.

Exit criteria:

- Không còn mock recipe/user/API response.
- App render được shell tối thiểu mà không có data giả.
- Production build pass.

Commit đề xuất:

```text
refactor(frontend): establish project foundation
```

## 12. Phase 1 — Application shell, routing và layouts

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Chuyển sang React Router Data Mode với `createBrowserRouter`.
- [ ] Tạo `PublicLayout`, `AuthLayout`, `UserLayout`, `AdminLayout`.
- [ ] Khai báo toàn bộ route và route error element.
- [ ] Tạo Header, Footer, sidebar và responsive navigation.
- [ ] Tạo ThemeProvider và theme switcher.
- [ ] Tạo page 401, 403, 404 và 500.
- [ ] Kiểm tra route trực tiếp bằng URL và browser refresh.
- [ ] Chạy build và route smoke test.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Tất cả route render đúng layout.
- Route không tồn tại hiển thị 404.
- Admin/user route chưa có session không render nội dung protected.

Commit đề xuất:

```text
feat(frontend): add layouts and application routing
```

## 13. Phase 2 — API client, auth và session

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Tạo và validate `VITE_API_URL`.
- [ ] Xây `apiClient` và normalized `ApiError`.
- [ ] Tạo AuthProvider.
- [ ] Kết nối register, login, refresh, logout và me.
- [ ] Tạo ProtectedRoute và RoleRoute.
- [ ] Thêm auth bootstrap skeleton.
- [ ] Xử lý expired access token bằng một refresh attempt.
- [ ] Không lưu refresh token hoặc password trong browser storage.
- [ ] Test login success, invalid credentials, refresh và logout.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Reload browser vẫn phục hồi được session bằng refresh cookie.
- `401` không tạo refresh loop.
- Logout xóa session frontend và backend.

Commit đề xuất:

```text
feat(frontend): integrate authentication session
```

## 14. Phase 3 — Public recipe experience

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Kết nối Home với recipe published.
- [ ] Kết nối recipe list, pagination và sort whitelist.
- [ ] Đồng bộ search/filter vào URL search params.
- [ ] Kết nối tìm theo nguyên liệu chính.
- [ ] Kết nối recipe detail, rating aggregate và public comments.
- [ ] Tạo RecipeCard, RecipeGrid và RecipeFilters.
- [ ] Tạo HomeSkeleton, RecipeGridSkeleton và RecipeDetailSkeleton.
- [ ] Tạo empty state cho list/search không có kết quả.
- [ ] Xử lý recipe 404.
- [ ] Kiểm tra mobile layout và keyboard navigation.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Không còn recipe hard-code.
- Query URL có thể bookmark và refresh.
- Loading, empty, error và success state đều được kiểm tra.

Commit đề xuất:

```text
feat(frontend): build public recipe experience
```

## 15. Phase 4 — Recipe authoring và moderation

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Tạo RecipeForm dùng chung cho create/edit.
- [ ] Kết nối category, ingredient và tag catalog.
- [ ] Hỗ trợ ingredients với role `MAIN`, `SECONDARY`, `SEASONING`.
- [ ] Yêu cầu ít nhất một nguyên liệu `MAIN` trước submit.
- [ ] Hỗ trợ thêm/xóa/sắp xếp cooking steps.
- [ ] Kết nối create draft, edit, submit và archive.
- [ ] Hiển thị trạng thái DRAFT/PENDING/REJECTED/PUBLISHED.
- [ ] Hiển thị rejection reason.
- [ ] Có pending state cho mọi mutation.
- [ ] Test ownership và forbidden state.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- User có thể tạo draft và submit review hoàn chỉnh.
- Không submit trùng khi user double-click.
- Validation backend được map vào form khi có thể.

Commit đề xuất:

```text
feat(frontend): add recipe authoring workflow
```

## 16. Phase 5 — User features

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Kết nối preferences và locale.
- [ ] Đồng bộ theme local với profile sau login.
- [ ] Kết nối favorite add/remove.
- [ ] Kết nối rating create/update.
- [ ] Kết nối comment create/list.
- [ ] Xây collections list/detail/create/edit/delete.
- [ ] Kết nối add/remove recipe trong collection.
- [ ] Xây meal plan theo tuần.
- [ ] Có skeleton riêng cho collection và meal plan.
- [ ] Có empty state cho từng user feature.
- [ ] Test user không thể truy cập dữ liệu của người khác.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Các feature user dùng dữ liệu thật và phản ánh mutation ngay sau thành công.
- Không có optimistic update nếu chưa có rollback rõ ràng.

Commit đề xuất:

```text
feat(frontend): integrate user planning features
```

## 17. Phase 6 — Cooking mode và cooking history

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Xây cooking mode từng bước.
- [ ] Timer dùng `timerSeconds` từ recipe step.
- [ ] Lưu progress cooking session ở client trong thời gian đang nấu.
- [ ] Kết nối create cooking log khi hoàn thành.
- [ ] Kết nối cooking history.
- [ ] Kết nối metadata ảnh thành phẩm sau upload flow đã thống nhất.
- [ ] Thêm cooking mode skeleton và history skeleton.
- [ ] Xử lý page refresh trong cooking session.
- [ ] Test timer cleanup khi rời route.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Timer không nhân đôi trong React Strict Mode.
- Cooking log chỉ được tạo khi user xác nhận hoàn thành.

Commit đề xuất:

```text
feat(frontend): build cooking mode and history
```

## 18. Phase 7 — Admin experience

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Kết nối moderation queue.
- [ ] Hiển thị recipe detail trước khi approve/reject.
- [ ] Yêu cầu rejection reason.
- [ ] Kết nối approve/reject mutation.
- [ ] Kết nối audit logs cho Admin.
- [ ] Thêm table/card skeleton.
- [ ] Xử lý empty moderation queue.
- [ ] Test USER nhận 403 và không thấy admin navigation.
- [ ] Test EDITOR không truy cập audit logs nếu backend cấm.
- [ ] Đổi phase sang `DONE`.

Exit criteria:

- Role guard frontend và RBAC backend cho kết quả nhất quán.
- Approve/reject cập nhật queue sau thành công.

Commit đề xuất:

```text
feat(frontend): add moderation experience
```

## 19. Phase 8 — Quality gate và FE handoff

Trạng thái: `NOT_STARTED`

Checklist:

- [ ] Đổi phase sang `IN_PROGRESS`.
- [ ] Không còn mock data hoặc hard-coded API response.
- [ ] Không còn placeholder page trong route production.
- [ ] Kiểm tra toàn bộ skeleton và empty state.
- [ ] Kiểm tra responsive mobile/tablet/desktop.
- [ ] Kiểm tra keyboard navigation và visible focus.
- [ ] Kiểm tra contrast light/dark.
- [ ] Kiểm tra reduced motion.
- [ ] Kiểm tra token refresh và protected routes.
- [ ] Chạy production build.
- [ ] Chạy frontend test suite.
- [ ] Chạy end-to-end happy path với backend thật.
- [ ] Cập nhật README cách chạy cả backend/frontend.
- [ ] Đổi phase sang `DONE`.

Happy path cuối:

```text
Register
→ Login
→ Browse/search recipes
→ View recipe detail
→ Favorite/rating/comment
→ Create collection
→ Add meal plan item
→ Complete cooking mode
→ View cooking history
→ Create and submit recipe
→ Editor approve recipe
```

Exit criteria:

- `npm run build` pass.
- Không có console error trong happy path.
- Không có dữ liệu giả xuất hiện khi backend rỗng.
- Mọi page có loading, empty, error hoặc success state phù hợp.

Commit đề xuất:

```text
test(frontend): complete frontend quality gate
```

## 20. Definition of Done cho mỗi page

Một page chỉ hoàn thành khi:

- [ ] Đúng layout.
- [ ] Route hoạt động khi điều hướng và refresh trực tiếp.
- [ ] Dùng API thật hoặc là trang static được xác định rõ.
- [ ] Không có mock data.
- [ ] Có skeleton nếu tải bất đồng bộ.
- [ ] Có empty state nếu dữ liệu có thể rỗng.
- [ ] Có error state và retry khi phù hợp.
- [ ] Có unauthorized/forbidden handling nếu protected.
- [ ] Responsive.
- [ ] Keyboard accessible.
- [ ] Không có console error.
- [ ] Build pass.

## 21. Kiểm thử

### Mức component

- Skeleton render đúng số lượng và hình dạng chính.
- EmptyState render đúng message/CTA.
- Form validation không gửi request sai rõ ràng.
- Role guard render đúng fallback.

### Mức integration

- Loader xử lý success, empty, 401, 403, 404 và 500.
- Mutation disable submit trong lúc pending.
- URL filter đồng bộ với UI.
- Refresh token chỉ chạy một lần cho request 401.

### Mức end-to-end

- Auth flow.
- Public recipe flow.
- User planning flow.
- Cooking flow.
- Recipe author/moderation flow.

## 22. Những việc không làm ở thời điểm này

- SSR hoặc React Server Components.
- Micro-frontend.
- Redux khi Context và route data vẫn đủ.
- Custom caching framework.
- WebSocket hoặc realtime notifications.
- AI recommendation.
- Offline-first synchronization.
- PWA nếu chưa có yêu cầu demo rõ ràng.
- Skeleton riêng cho từng component nhỏ; chỉ theo loading boundary có ý nghĩa.

## 23. Nguồn tham khảo chính thức

- [React — Thinking in React](https://react.dev/learn/thinking-in-react): component hierarchy, minimal state và one-way data flow.
- [React — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects): Effect chỉ dùng để đồng bộ external system, tránh Effect không cần thiết.
- [React — Suspense](https://react.dev/reference/react/Suspense): fallback, loading boundary và giới hạn của Suspense với data fetching.
- [React — Built-in components](https://react.dev/reference/react/components): StrictMode và Suspense.
- [React — Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary): fallback khi render tree gặp lỗi.
- [React Router — Picking a Mode](https://reactrouter.com/start/modes): lý do chọn Data Mode.
- [React Router — Pending UI](https://reactrouter.com/start/data/pending-ui): pending navigation và pending form state.
- [React Router — Navigating](https://reactrouter.com/start/framework/navigating): Link/NavLink và trạng thái navigation.
- [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode): quy tắc `VITE_` và mode-specific environment.

## 24. Decision log

| Ngày | Quyết định | Lựa chọn khác | Lý do |
|---|---|---|---|
| 2026-09-25 | Không dùng mock data | Fixture hoặc hard-code recipe | Empty state phải phản ánh backend thật |
| 2026-09-25 | React Router Data Mode | Declarative Mode | Loader/action/pending/error phù hợp data-driven app |
| 2026-09-25 | Fetch wrapper tối thiểu | Axios | Native fetch đủ cho API contract hiện tại |
| 2026-09-25 | Không dùng Redux ban đầu | Redux Toolkit | Global state hiện chỉ có auth và theme |
| 2026-09-25 | Skeleton theo page boundary | Spinner toàn trang | Giữ layout ổn định và phản ánh vùng đang tải |
| 2026-09-25 | Bốn layout | Một layout toàn app | Public/auth/user/admin có navigation và guard khác nhau |

## 25. Blockers đã biết

- Forgot/reset password chỉ được triển khai khi backend có endpoint tương ứng.
- Upload ảnh cần quyết định flow Supabase Storage trước khi kết nối file upload thật.
- Frontend test runner chưa được chọn; chỉ thêm ở Phase 0/1 khi bắt đầu viết test đầu tiên.
