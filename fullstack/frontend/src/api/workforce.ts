export const assignWorker = async (workerId: number) => {
  const token = localStorage.getItem("access_token")

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/workforce/${workerId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to assign worker")
  }

  return res.json()
}