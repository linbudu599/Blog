---
category: Learning
tags:
  - Other
date: 2020-10-28
title: 从一个需求出发，聊一聊useRef三兄弟
---

## 前言

Vue、React、Angular这一类前端框架的出现使得我们不再需要去手动操作Dom了，回想曾经的JQuery时代，与DOM打交道是最为频繁也最为头疼的，比如我前端入门时期收获最多的书之一就是**JavaScript DOM编程艺术**。

现在我们和DOM直接打交道的机会少的多了，但在部分场景下仍然不可避免，比如输入框的聚焦、滚动、文本选择以及动画等场景。在Vue中，我们有`ref`与`$refs`，在React中我们有`ref`、`createRef`以及本文的`useRef`三兄弟（指`useRef`、`forwardRef`以及`useImperativeHandle`），来使得我们能够在某些无法避免的场景下方便的操作dom。

> 以下内容的阅读需要你了解`useRef`三兄弟，如果你此前没有了解过，可以直接跳到正文第一部分，我会依次讲解`useRef`三兄弟的使用。

会想写这篇文章不是因为`useRef`三兄弟有多么重要，实际上大部分前端同学很少会使用到它。而是我遇到的这个场景让我意识到了`useRef`在除了DOM以外的场景能起到特殊的作用：

我之前的实习期间负责的一个函数配置平台，FaaS函数需要在这个平台完成一系列配置（具体包含哪些配置项就不说了），这些配置被我分割成多个独立组件，每一个组件能够负责自己的数据。但某一天来了个比较大的变更需求，现在需要**允许其他用户（阿里的其他BU）自己编写配置组件，并且能够无缝接入到整体配置中**。简单地说，现在**我要在用户完成配置后，收集到用户编写组件透出的数据，并完成统一的提交**。

具体其中的思路以及方案比对就直接略过，最后我给出的方案大概是这样的：

- 提供一个脚手架，封装开发规范，用户自定义组件需要使用脚手架开发并发布到内部npm源
- 开发规范包括必须实现两个方法：数据收集`collect`与数据校验`validate`方法，前者在调用时返回组件内的配置信息与元数据，后者对组件配置进行校验后返回校验状态
- 在配置完成时，主组件会获取到所有自定义子组件的校验状态(`validate`方法)以及数据（`collect`方法），在完成校验后，将子组件数据统一合入状态树进行保存。

看起来很简单，但有这么几个问题：

父组件如何获取到子组件方法：

- **很简单，用`useRef`三兄弟，将子组件的方法暴露出去，父组件通过`ref`进行调用，如`ref.current.validate()`**

待配置的函数项（每一个函数都需要依次进行配置）与用户配置中存在的自定义配置项都是不确定的，由于hooks的原则（**不要在循环中使用hooks**），我们不能根据函数以及配置项数量动态的调用useRef生成ref：

- 那就用一个ref就行，所有的方法都挂载到这个ref上

ref在多次写入的情况下，上面的`current`属性会被覆盖，即使是不同的键名：

- **自己封装一个hook，允许每次写入`current`时进行值的合并**

~~好了，结束，全文完~~

我把最后一步封装的hook称为`useMultiImperativeHandle`，名字很长，但实际上非常简单，因为它实际上就是对`useImperativeHandle`的增强，底层也是基于其实现。在最后一部分，我会介绍它的思路与实际使用，如果你对`useRef`相关已经比较了解，可以直接查看 **[ useMultiImperativeHandle源码 ](https://github.com/linbudu599/useMultiImperativeHandle)**（真的很简单）

> 建议使用我写的 **[Parcel-Tsx-Template](https://github.com/linbudu599/Parcel-Tsx-Template)** 来跑本文中的demo，比`Webpack`以及`Create-React-App`轻便的多，并且足够handle常见中小项目了。

## useRef

在React的Class组件时期，我们通过`createRef`创建ref，看看官网的示例：

```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
  }

  render() {
    return <input type="text" ref={this.inputRef} />;
  }

  componentDidMount() {
    this.inputRef.current.focus();
  }
}
```

在这个例子里ref被分配给了原生DOM元素`<input />`，在这种情况下可以通过`ref.current`获取到这个DOM元素，并直接调用上面的方法。ref也可以被分配给一个Class组件，这样`ref.current`获取到的就是这个Class组件的实例。

但是，ref不能被分配给一个函数式组件（除非使用`forwardRef`，详见下一部分），因为**函数式组件没有实例**。

在函数式组件中，我们这样使用`ref`（注意，“在函数组件中使用ref” !== “将ref分配给函数式组件”）

```javascript
function TextInputWithFocusButton() {
  const inputEl = useRef(null);
  const onButtonClick = () => {
    inputEl.current.focus();
  };
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

`createRef`和`useRef`的重要区别是`createRef`不能用在函数式组件中，而`useRef`不能用在Class组件中，前者的不能指的是 **在函数式组件中使用`createRef`创建的`ref`，其值会随着函数式组件的重新执行而不断初始化**，而后者的不能就比较简单了，hooks不能用在Class组件嘛。

useRef实际上还有一些奇技淫巧，由于它能够在组件的整个生命周期内保存current上的值，因此经常被用来解决一些闭包（参考Dan写的[这篇文章](https://overreacted.io/a-complete-guide-to-useeffect/)）与计时器问题，比如阿里开源的React Hooks库 [ahooks ](https://github.com/alibaba/hooks)中就大量使用了useRef来保存计时器，我之前写的一个自定义hooks [useVerifyCode](https://github.com/PenumbraPro/react-useVerifyCode-hook) 也是。

> 这个hooks设计的场景是面向前端常见的验证码场景，如点击发送短信-禁用按钮60秒-恢复按钮点击。

还有官方给的这个自定义hook`usePrevious`：

```tsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

这个hooks可以拿到上一次的值，原理是`useEffect`会在每次渲染完毕后执行，所以ref的值在本次渲染过程永远会停留在上一次。



## forwardRef

前面我们说，`ref`不能被分配给函数式组件（无论这个`ref`是通过哪种方式创建的），准确的说应该是：**`ref`不能被分配给没有给`forwardRefd`包裹的函数式组件**。

`forwardRef`的使用是这样的：

```typescript
const App: React.FC = () => {
  const ref = useRef() as MutableRefObject<any>;

  useEffect(() => {
    ref.current.focus();
  }, []);

  return (
    <>
      <Child ref={ref} />
    </>
  );
};

const Child = forwardRef((props, ref: Ref<any>) => {
  return <input type="text" name="child" ref={ref} />;
});
```

> 由于这里类型不是重点，所以我就直接any了

`forwardRef`可以直接包裹一个函数式组件，被包裹的函数式组件会获得被分配给自己的ref（作为第二个参数）。

> 如果你直接将`ref`分配给没有被`forwardRef`包裹的函数式组件，React会在控制台给出错误。

`forwardRef`的另一种使用场景是 [高阶组件中转发refs](https://zh-hans.reactjs.org/docs/forwarding-refs.html#forwarding-refs-in-higher-order-components)， 由于HOC的使用越来越少，这里就不做展开，有兴趣的同学可以查看链接。

`forwardRef`通常是和`useImperativeHandle`一起使用，如果说`forwardRef`使得函数式组件拥有了让别人一窥芳容的能力，`useImperativeHandle`则就是她脸上的面纱：她可以随心所欲决定想让你看到什么。



## useImperativeHandle

在`forwardRef`例子中的代码实际上是不推荐的，因为**无法控制要暴露给父组件的值**，所以我们使用`useImperativeHandle`控制要将哪些东西暴露给父组件：

先来看看`@types/react`中的调用签名：

```tsx
function useImperativeHandle<T, R extends T>(ref: Ref<T>|undefined, init: () => R, deps?: DependencyList): void;
```

从这个签名我们大概能get到调用方式：

- 接收一个`ref`
- 接收一个函数，**这个函数返回的对象即是要暴露出的`ref`**
- 类似`useEffect`，接收一个依赖数组

```tsx
onst App: React.FC = () => {
  const ref = useRef() as MutableRefObject<any>;

  useEffect(() => {
    ref.current.input.focus();
  }, []);

  return (
    <>
      <Child ref={ref} />
    </>
  );
};

const Child = forwardRef((props, ref: Ref<any>) => {
  const inputRef1 = useRef() as MutableRefObject<HTMLInputElement>;
  const inputRef2 = useRef() as MutableRefObject<HTMLInputElement>;

  useImperativeHandle(
    ref,
    () => {
      return {
        input: inputRef1.current,
      };
    },
    [inputRef1]
  );

  return (
    <>
      <input type="text" name="child1" ref={inputRef1} />
      <br />
      <input type="text" name="child2" ref={inputRef2} />
    </>
  );
});
```

在这个例子中，我们在`Child`组件内再次创建了两个ref，但我们只想暴露出第一个，因此使用`useImperativeHandle`来进行了控制。

现在我们可以理解了：`useImperativeHandle`的第一个参数表示你要操作的`ref`，第二个参数的返回值则是你要挂载在这个`ref`的`current`属性上的值。你可以理解为**一根垂直管道，你在上方投入了什么，下方拿到的就是什么**。最后一个参数则是在`inputRef1`变化时更新这个挂载。

> 单纯的useRef不会在挂载对象时进行通知，如果有这个需求，需要使用[callback ref](https://zh-hans.reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node)。

useRef不一定要用来保存DOM或者Class组件，还可以用来保存计时器或是广义上的一个需要在生命周期内保持不变的值，同样的，那在使用`useImperativeHandle`时我们也不一定要返回ref，比如我们返回子组件内定义的方法：

```tsx
const App: React.FC = () => {
  const globalRef = useRef() as MutableRefObject<any>;

  return (
    <>
      <button
        onClick={() => {
          console.log(globalRef.current.method());
        }}
      >
        Invoke method from Child
      </button>
      <Child ref={globalRef} />
    </>
  );
};

const Child = forwardRef((props, ref) => {
  const innerMethod = () => 'METHOD_FROM_CHILD';

  useImperativeHandle(ref, () => ({
    method: innerMethod,
  }));

  return <p>Child</p>;
});
```

原本我们的思维是React中只能子组件调用父组件传入的回调函数，但有时我们的确需要反过来，这时就需要使用这样的思路了。

这个例子里只有一个子组件，假设我们有一个列表，每个列表项都需要挂载一个方法，可能会这么写：

```tsx
import React, {
  useRef,
  forwardRef,
  MutableRefObject,
  Ref,
  useImperativeHandle,
} from 'react';

// 我经常被吐槽艺名多... 我也不想啊quq
const LIST = ['林不渡', '穹心', '一茶'];

type IInnerFunc = () => string;
type IGlobalRef = {
  [key: string]: IInnerFunc;
};

const App: React.FC = () => {
  const globalRef = useRef(null) as MutableRefObject<IGlobalRef>;

  const invokeAllMountMethod = () => {
    const globalObject = globalRef?.current;
    for (const [, method] of Object.entries(globalObject)) {
      method();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          invokeAllMountMethod();
        }}
      >
        INVOKE
      </button>
      {LIST.map((item, idx) => (
        <Item label={item} idx={idx} key={item} ref={globalRef} />
      ))}
    </>
  );
};

const Item: React.FC<{
  label: string;
  idx: number;
  ref: Ref<any>;
}> = forwardRef(({ label, idx }, ref) => {
  const innerMethod = () => {
    console.log(`${label}-${idx}`);
  };

  useImperativeHandle(ref, () => ({
    [`method-from-${idx}`]: innerMethod,
  }));

  return <p>{label}</p>;
});

```

在这个例子里我们创建了一个`globalRef`，并在每个列表项组件中都使用这个globalRef进行挂载子组件内部的方法。但是跑一下demo你就会发现只有最后一个列表项的方法被挂载上去了。实际上，我们在前面也提到了这一点：**一根垂直管道，你在上方投入了什么，下方拿到的就是什么**， 我们始终只有一个`globalRef`，因此多次调用下最后一次的挂载覆盖掉了前面的。

我们现在就回到了前言中的场景：**如何在挂载时将已存在的值和本次挂载的值进行合并？**

回想下，`useImperativeHandle`中我们会把`init`函数返回的对象挂载到**初始ref的current属性**上，**返回什么就挂载什么**。这也意味着我们是能拿到初始`ref`的`current`属性，那么就很简单了，直接**把先前的current和本次的对象合并**就好了：

```typescript
{
   ...originRef.current,
   ...convertRefObj,
};
```

换到上面的例子，列表项的依次挂载就能够实现了。



## useMultiImperativeHandle

直接给源码，因为就没啥复杂的：

```typescript
import { useImperativeHandle, MutableRefObject, DependencyList } from 'react';

const useMultiImperativeHandle = <T, K extends object>(
  originRef: MutableRefObject<T>,
  convertRefObj: K,
  deps?: DependencyList
): void =>
  useImperativeHandle(
    originRef,
    () => {
      return {
        ...originRef.current,
        ...convertRefObj,
      };
    },
    deps
  );

export default useMultiImperativeHandle;
```

在上面的例子中使用：

```tsx
const Item: React.FC<{
  label: string;
  idx: number;
  ref: Ref<IGlobalRef>;
}> = forwardRef(({ label, idx }, ref) => {
  const innerMethod = () => {
    console.log(`${label}-${idx}`);
  };

  useMultiImperativeHandle(ref as MutableRefObject<IGlobalRef>, {
    [`method-from-${idx}`]: innerMethod,
  });

  return <p>{label}</p>;
});
```



Done！这就是我上面的需求实现的基本思路了，使用一个全局唯一的`ref`，将组件内部的方法挂载到这个`ref`上而不需要关心有哪些方法，最终只需要遍历上面的方法，然后由这个方法来收集组件数据即可。

真·全文完

这篇文章其实内容没有太多干货，主要是我为了解决动态列表组件的方法挂载而封装的一个简单hook，以及函数式组件中的useRef三兄弟的使用，以及**在父组件中调用子组件的方法**真的让我感觉挺神奇的，你也许可以试试，看看能不能基于这些hook来根据自己的业务场景定制属于自己的hooks，不论最后的产物是不是很简单（比如这篇文章中的主角），毕竟那代表着你开始潜移默化接受React Hooks思想的第一步。



## 相关链接：

- **[useMultiImperativeHandle](https://github.com/linbudu599/useMultiImperativeHandle)**
- **[useRef](https://zh-hans.reactjs.org/docs/hooks-reference.html#useref)**
- **[useImperativeHandle](https://zh-hans.reactjs.org/docs/hooks-reference.html#useimperativehandle)**
- **[useVerifyCode](https://github.com/PenumbraPro/react-useVerifyCode-hook)**
- **[Parcel-Tsx-Template](https://github.com/linbudu599/Parcel-Tsx-Template)**
- **[GitHub](https://github.com/linbudu599)**


