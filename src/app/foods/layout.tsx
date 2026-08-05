// The page itself is a client component, which cannot export metadata, so the
// title lives on this pass-through layout instead.
export const metadata = { title: "Foods · Health" };

export default function FoodsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
