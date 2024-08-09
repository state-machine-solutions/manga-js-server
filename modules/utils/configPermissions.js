function configPermissions(data = null) {
  const permissions = {
    ping: true,
    get: true,
    set: true,
    reset: true,
    message: true,
    delete: true,
    clear: true,
    toString() {
      let r = [];
      for (let i in permissions) {
        if (i == "toString") continue;
        if (!permissions[i]) continue;
        r.push(i)
      }
      return r.join('|');
    }
  }
  if (!data) {
    return permissions;
  }
  for (let i in permissions) {
    if (i == "toString") continue;
    permissions[i] = data[i] === false ? false : true;
  }
  return permissions;
}

module.exports = configPermissions;