import { expectType } from "tsd";
import createStateRouter, { Renderer, Router, State } from ".";

class TemplateInputType {}
class TemplateOutputType {}
class ElementType {}

class TestRenderer
  implements Renderer<TemplateInputType, ElementType, TemplateOutputType> {
  render(
    context: {
      template: TemplateInputType;
      element: ElementType;
      content: any;
      parameters: { [key: string]: any };
    },
    callback: (err: any, output: TemplateInputType) => void
  ) {}
  reset(
    context: {
      domApi: TemplateOutputType;
      content: any;
      template: TemplateInputType;
      parameters: { [key: string]: any };
    },
    callback: (err: any, output: TemplateOutputType) => void
  ) {}
  destroy(domApi: TemplateOutputType, callback: () => void) {}
  getChildElement(
    domApi: TemplateOutputType,
    callback: (err: any, element: ElementType) => void
  ) {}
}

createStateRouter(new TestRenderer(), {});
createStateRouter(new TestRenderer(), {}, {});
createStateRouter(
  new TestRenderer(),
  {},
  {
    pathPrefix: "",
    throwOnError: true
  }
);

let stateRouter = createStateRouter(
  new TestRenderer(),
  {},
  {
    pathPrefix: "",
    throwOnError: true
  }
);

expectType<Router<TemplateInputType, TemplateOutputType>>(stateRouter);

stateRouter.addState({
  name: "name",
  template: new TemplateInputType()
});

stateRouter.addState({
  name: "name",
  template: new TemplateInputType(),
  defaultChild: "default",
  data: Symbol("ANY"),
  resolve: function(data, parameters, callback) {},
  activate: function({ domApi, data, parameters, content }) {
    expectType<TemplateOutputType>(domApi);
    expectType<any>(data);
    expectType<{ [key: string]: any }>(parameters);
    expectType<any>(content);
  },
  querystringParameters: ["a", "b"],
  defaultParameters: {
    a: "1",
    b: "2"
  }
});

stateRouter.go("app");
stateRouter.go("app", { param: "value" });
stateRouter.go(
  "app",
  { param: "value" },
  {
    replace: true
  }
);
stateRouter.go(
  "app",
  { param: "value" },
  {
    inherit: true
  }
);

stateRouter.evaluateCurrentRoute("app");
stateRouter.evaluateCurrentRoute("app", { param: "value" });

expectType<boolean>(stateRouter.stateIsActive("app"));
expectType<boolean>(stateRouter.stateIsActive("app", { param: "value" }));

expectType<string>(stateRouter.makePath("app.tab2"));
expectType<string>(stateRouter.makePath("app.tab2", { pants: "no" }));

let state = stateRouter.getActiveState();
expectType<State>(state);
expectType<string>(state.name);
expectType<{ [key: string]: any }>(state.parameters);

stateRouter.on("stateChangeAttempt", caller => {
  expectType<Function>(caller);
});

stateRouter.on("stateChangeStart", (state, parameters, states) => {
  expectType<State>(state);
  expectType<{ [key: string]: any }>(parameters);
  expectType<State[]>(states);
});

stateRouter.on("stateChangeCancelled", err => {
  expectType<any>(err);
});

stateRouter.on("stateChangeEnd", (state, parameters, states) => {
  expectType<State>(state);
  expectType<{ [key: string]: any }>(parameters);
  expectType<State[]>(states);
});

stateRouter.on("stateChangeError", err => {
  expectType<any>(err);
});

stateRouter.on("stateError", err => {
  expectType<any>(err);
});

stateRouter.on("routeNotFound", (route, parameters) => {
  expectType<string>(route);
  expectType<{ [key: string]: any }>(parameters);
});

stateRouter.on("beforeCreateState", ({ state, content, parameters }) => {
  expectType<State>(state);
  expectType<any>(content);
  expectType<{ [key: string]: any }>(parameters);
});

stateRouter.on("beforeResetState", ({ state, content, parameters }) => {
  expectType<State>(state);
  expectType<any>(content);
  expectType<{ [key: string]: any }>(parameters);
});

stateRouter.on("afterResetState", ({ state, content, parameters }) => {
  expectType<State>(state);
  expectType<any>(content);
  expectType<{ [key: string]: any }>(parameters);
});

stateRouter.on("beforeDestroyState", ({ state, domApi }) => {
  expectType<State>(state);
  expectType<TemplateOutputType>(domApi);
});

stateRouter.on("afterDestroyState", ({ state }) => {
  expectType<State>(state);
});
