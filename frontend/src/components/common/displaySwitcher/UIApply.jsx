import { useEffect } from "react";
import { useSelector } from "react-redux";

const FONT_SIZES = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export default function UIApply({ children }) {
  const siteMode = useSelector((s) => s.ui.siteMode);
  const fontSize = useSelector((s) => s.ui.fontSize);

  useEffect(() => {
    const html = document.documentElement;

    // mode class (sizning eski applyMode aynan shu edi)
    html.classList.remove("mode-normal", "mode-grayscale", "mode-dimmed");
    html.classList.add(`mode-${siteMode}`);

    // font-size
    html.style.fontSize = FONT_SIZES[fontSize] || FONT_SIZES.medium;
  }, [siteMode, fontSize]);

  return children;
}
