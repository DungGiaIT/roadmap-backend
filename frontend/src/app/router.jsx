import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

function HomePage() {
    return (
        <main className="home-page">
            <p className="eyebrow">VietRecipe</p>
            <h1>Công thức Việt, nấu theo cách của bạn.</h1>
            <p className="intro">Khám phá và chia sẻ những món ăn bạn yêu thích.</p>
            <Link to="/recipes">Khám phá công thức</Link>
        </main>
    );
}

function NotFoundPage() {
    return (
        <main className="home-page">
            <h1>Không tìm thấy trang</h1>
            <Link to="/">Về trang chủ</Link>
        </main>
    );
}

export function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
