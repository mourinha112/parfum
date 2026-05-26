import Image from "next/image";

export default function Logo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? { w: 420, h: 310 }
      : size === "sm"
        ? { w: 140, h: 104 }
        : { w: 260, h: 193 };
  return (
    <Image
      src="/logotipo.jpeg"
      alt="Imperial Parfum"
      width={dims.w}
      height={dims.h}
      priority
      className="drop-shadow-[0_0_40px_rgba(212,175,55,0.25)]"
    />
  );
}
