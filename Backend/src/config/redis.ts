// Redis removed. Provide a minimal no-op stub to avoid ref errors if any leftover import exists.
const redisStub = {
  get: async () => null,
  set: async () => undefined,
  del: async () => undefined
};
export default redisStub;
