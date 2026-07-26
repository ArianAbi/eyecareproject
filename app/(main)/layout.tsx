import Header from "@/components/core/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
  <Header />
  <main>{children}</main>
  </> 
  ;
}