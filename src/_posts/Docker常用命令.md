---
category: Learning
tags:
  - Other
date: 2020-3-13
title: Docker常用指令
---

> 真就几天不搞 `Docker` 就要迷迷糊糊呗, 那我就记录一篇常用命令好了.

## 一套 Docker CI/CD 流程

> 不包含 `Docker-Compose`, 单个容器

### 配置 `Dockerfile`

- FROM \<image>:\<tag>, 你的镜像要使用的基础镜像, 比如我要部署一个单页面应用, 那么就这么写

```Dockerfile
FROM nginx
```

- WORKDIR \<path>, 相当于`cd`命令, 会将`path`作为你的工作目录, (为后续`RUN` `CMD` `ENTRYPOINT`)

- LABEL \<key> = \<value>, 添加元数据

- EXPOSE \<port>, 容器向外暴露的端口

- COPY \<local path> \<remote path>, 拷贝文件到容器内

- ADD, 类似于 COPY, 但参数还可以是 url/tar 文件(自动解压)

- VOLUME, [\<volume-name>:]\<container-path>, 挂载数据卷, 常用于数据库容器

- ENTRYPOINT, 每个 Dockerfile 只能有一个(最后一个起效)

```Dockerfile
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2
```

- RUN \<command>, 在容器构建过程执行命令

- CMD \<command>, 在容器启动时执行的命令, 只能有一个

> `CMD` 与 `ENTRYPOINT`还是有一定不同的, 如 docker run 启动容器并执行命令时不会覆盖`ENTRYPOINT`, 但是会覆盖掉`CMD`命令
>
> 使用 RUN 指令安装应用和软件包，构建镜像。如果 Docker 镜像的用途是运行应用程序或服务，比如运行一个 MySQL，应该优先使用 Exec 格式的 ENTRYPOINT 指令。CMD 可为 ENTRYPOINT 提供额外的默认参数，同时可利用 docker run 命令行替换默认参数。如果想为容器设置默认的启动命令，可使用 CMD 指令。用户可在 docker run 命令行中替换此默认命令。

- ENV key=value, 指定环境变量, 并且可以被`RUN`指令使用

- ONBUILD [INSTRUCTION], 当前镜像作为基础镜像(`FROM`)时会执行的指令

### 配置 `Travis` / `GitHub Actions`

> 说实话我比较喜欢 GitHub Actions

以 GitHub Actions 为例, 打包镜像并 push 到 docker 仓库

```push.yml
name: Docker

on:
  push:
    # Publish `master` as Docker `latest` image.
    branches:
      - master

env:
  # 镜像名称
  IMAGE_NAME: ga-test

jobs:
  push:
    needs: test

    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - uses: actions/checkout@v2

      - name: Build image
        run: docker image build ./ -t <user>/<image>:<tag>

      - name: Log into registry
        run: echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin

      - name: Push image
        run: |
          docker push <user>/<image>:<tag>
```

记得实现传好秘密变量~

### 服务器拉取镜像并运行容器

这一步就花样百出了, 你可以每次手动 pull 最新镜像再运行(或者写个脚本一键运行), 整个触发器每次 push 完向服务器发一条请求, 然后自动运行前面的脚本啥的(阿里云地容器服务就提供了这个思路的触发器), 说到这个我想说纯静态页面就没有必要上 Docker 了, 直接 build 完用自带的 ssh 传到服务器上就行了不好吗:-)

#### docker run 的选项

- --rm, 容器停止后删除容器
- -d, 容器保持在后台进行(datach)
- -p \<host-port>:\<container-port>, 端口映射
- -v ，即`volume`， 如`-v $(PWD):/usr/share/nginx/html`是将当前目录挂载, 加上`:ro`控制容器只读
- -it, 打开 STDIN 与分配 TTY 设备， 二者通常一起用来在容器中执行命令
- -w, \<path>, 容器工作目录
- --expose, 修改镜像暴露端口
- --name, 容器名
- --restart="no/on-failure/always", 指定容器停止后的重启策略

- 几个示例

  - 运行一个在后台不断执行的容器，同时带有命令，程序被终止后还能重启继续跑，还能用控制台管理 `docker run -d --restart=always ubuntu:latest ping www.docker.com`

  - `docker run --rm -p 8080:80 -v $(PWD):/usr/share/nginx/html nginx:latest`

## 其他常用命令

- docker ps -a 列出所有容器，包括未在运行的
- docker images 列出所有镜像
- docker search 搜索镜像
- docker inspect \<name> 查看镜像详情
- docker rmi \<name> \<name> 移除镜像
- docker create/start \<image> 创建/启动容器
- docker stop 停止容器
- docker rm -f 停止并删除容器
- docker exec \<name> \<command>, `docker exec -it <name\> bash`
- docker attach \<container>, 连接到容器
- docker stat 查看容器资源占用
- docker stop \$(docker ps -a -q) 停止所有容器
- docker rm \$(docker ps -a -q) 删除所有容器
- docker port 查看容器端口映射
- docker top 查看容器内部进程
- docker info 查看 docker 信息
- docker commit -m \<info> -a \<username> \<container> user/repo:tag 提交镜像
- docker save 保存镜像为文件

## 持续更新

持 续 更 新
