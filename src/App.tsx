import { useEffect, useState } from "react";
import LandingPage from "./LandingPage";
import MobileHome from "./MobileHome";
import SiteHeader from "./SiteHeader";

const DESIGN_WIDTH = 1512;
const DESIGN_HEIGHT = 6256;
const MOBILE_QUERY = "(max-width: 767px)";

function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}

export default function App() {
  const mobile = useMobile();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const width = document.documentElement.clientWidth;
      setScale(Math.min(1, width / DESIGN_WIDTH));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    if (mobile) return;
    document.documentElement.style.setProperty("--header-offset", `${82 * scale}px`);
  }, [scale, mobile]);

  if (mobile) return <MobileHome />;

  return (
    <div className="bg-black">
      <SiteHeader scale={scale} />
      <div
        className="mx-auto overflow-hidden"
        style={{ width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale }}
      >
        {/* 窄屏等比缩小，1512 及以上保持设计稿原始像素。 */}
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <LandingPage />
        </div>
      </div>
    </div>
  );
}
