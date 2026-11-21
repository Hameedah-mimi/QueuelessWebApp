import { Link } from "react-router-dom";

export default function Logo({ className = "h-8", showText = true, to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group shrink-0">
      <div className="w-12 h-9 overflow-hidden rounded-lg flex items-center justify-center shrink-0">
        <img
          src="/queless.png"
          alt="QueueLess"
          className={`${className} w-auto object-contain scale-[1.95] transition-transform group-hover:scale-[2.05] duration-200`}
        />
      </div>

      {showText && (
        <div className="font-black text-xl tracking-tight flex items-center">
          <p className="text-[#102A43]">Queue</p>
          <p className="text-teal-600">Less</p>
        </div>
      )}
    </Link>
  );
}
