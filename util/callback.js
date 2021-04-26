import * as R from "ramda"

const executeIfPresent = R.unless(R.isNil, R.call)

export { executeIfPresent }
