export default async function (email: string) {
  const response = await fetch(`/api/routes/users?email=${email}`);

  const data = await response.json();

  console.log(data);

  return data.response;
}
