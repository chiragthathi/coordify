const serviceCursor = new Map()

export const getServiceInstances = (service) => {
  if (Array.isArray(service.instances) && service.instances.length > 0) {
    return service.instances
  }

  if (service.baseUrl) {
    return [service.baseUrl]
  }

  return []
}

export const pickNextInstance = (service) => {
  const instances = getServiceInstances(service)
  if (instances.length === 0) {
    return null
  }

  const current = serviceCursor.get(service.name) || 0
  const target = instances[current % instances.length]
  serviceCursor.set(service.name, (current + 1) % instances.length)

  return target
}

export const resetLoadBalancerState = () => {
  serviceCursor.clear()
}
