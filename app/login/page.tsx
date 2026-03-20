import LoginClient from "./LoginClient";

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;

  return <LoginClient error={typeof error === "string" ? error : null} />;
}
