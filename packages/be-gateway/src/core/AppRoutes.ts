import {
  ExpressMiddlewareFunction,
  getMetadata,
  MetaKey,
  RouteDefinition,
  RouterParams
} from '../core'
import { Router } from 'express'

export const AppRoutes = (routeControllers: any[]) => {
  const rootRouter = Router()

  routeControllers.forEach(controller => {
    const instance = new controller()
    console.log('================')

    const prefix = getMetadata(MetaKey.PREFIX, controller) as string
    const routes = getMetadata(MetaKey.ROUTES, controller) as RouteDefinition[]
    const controllerMiddleware = getMetadata(
      MetaKey.MIDDLEWARES,
      controller
    ) as ExpressMiddlewareFunction[]

    if (!prefix) return

    const controllerRouter = Router()
    const methodRouter = Router()
    console.log(prefix)
    console.log('middleware:', controllerMiddleware)

    // mainRouter.use(`${prefix}`)

    // console.log(prefix, routes)

    routes.forEach(r => {
      const params = getMetadata(
        MetaKey.PARAMS,
        controller,
        r.methodName
      ) as string[]

      const method = r.requestMethod
      const path = r.path
      const func = instance[r.methodName]

      if (!func) return

      if (params && params.length) {
        console.log('path', path, r.methodName)
        console.log(params)

        methodRouter[method](path, (req, res, next) => {
          const paramDatas = []
          params.forEach(p => {
            if (p === RouterParams.REQUEST) {
              paramDatas.push(req)
            }

            if (p === RouterParams.RESPONSE) {
              paramDatas.push(res)
            }

            if (p === RouterParams.NEXT) {
              paramDatas.push(next)
            }

            if (p === RouterParams.BODY) {
              paramDatas.push(req.body)
            }

            if (p === RouterParams.PARAM) {
              paramDatas.push(req.params)
            }

            if (p === RouterParams.QUERY) {
              paramDatas.push(req.query)
            }
          })

          instance.req = req
          instance.res = res
          instance.next = next
          func.apply(instance, paramDatas)
        })
      } else {
        console.log('path', path, r.methodName, func)
        methodRouter[method](path, (req, res, next) => {
          instance.req = req
          instance.res = res
          instance.next = next
          func.apply(instance, [])
        })
      }
    })

    const middlewares = controllerMiddleware || []
    controllerRouter.use(prefix, middlewares, methodRouter)

    rootRouter.use(controllerRouter)

    // mainRouter.use(prefix, childRouter)
    // routeList.push(mainRouter)
  })

  // console.log(routeList)

  return rootRouter
}