import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export function NavigationProgress() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (navigation.state === "loading") {
      setProgress(20);
      const t = setTimeout(() => setProgress(80), 100);
      return () => clearTimeout(t);
    } else {
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(t);
    }
  }, [navigation.state]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, backgroundColor: "var(--color-accent)" }}
      />
    </div>
  );
}
