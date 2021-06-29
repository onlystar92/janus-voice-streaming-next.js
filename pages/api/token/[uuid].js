async function createMagicToken(uuid) {
  const response = await fetch(
    `https://vapi.veltpvp.com/debug/api/magicToken/create/${uuid}`
  );
  return response.json();
}

export default async function handler(req, res) {
  const { uuid } = req.query;

  function handleSuccess({ data: { token } }) {
    console.info('Token created:', token);
    res.status(200).json({ success: true, token });
  }

  function handleError(error) {
    console.error(
      `An error ocurred while generating a magic token for ${uuid}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: 'Failed to create magic token' });
  }

  // Create magic token
  await createMagicToken(uuid).then(handleSuccess).catch(handleError);
}
