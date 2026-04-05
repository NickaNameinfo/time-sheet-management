/** Lets AuthContext trigger app theme reload without importing AppThemeContext (avoids provider / init ordering issues). */
let refetchFn = () => {};

export function registerAppThemeRefetch(fn) {
  refetchFn = typeof fn === "function" ? fn : () => {};
}

export function refetchAppThemeFromAuth() {
  refetchFn();
}
