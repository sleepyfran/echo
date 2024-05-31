# Echo's architecture

This little document outlines the general architecture of the app and the specific
usage it does of the Effect (https://effect.website) library. Since I'm relatively
new to the library, I'm also using this document to serve as a reference for myself
and a bit of a push to make myself understand everything better :^)

## Overview

This repository is a monorepo organized with the following structure:

- `packages/web`: Contains the main entry-point of the app, which is a React-powered
  web app. Overall this package just contains the minimum amount of code possible to
  bootstrap the app and render the main entry-point, which is then consumed from:
- `packages/components`: Reusable components that can be used across the app. This
  includes both tiny components (like a button) and also more complex ones like an
  entire page. Overall, packages in this directory should be organized around the
  concept they encapsulate, so for example an `Albums` package would contain all
  components and pages that deal with albums.
- `packages/core-types`: This is one of the most important packages of the app,
  so I'll list it separately. It contains all the model and service types that are
  later re-used and implemented in other packages. All models and services contained
  here should not be specific to any implementation, so for example the `Authentication`
  service defined here should not contain any logic specific to a specific media provider
  or a service the app depends upon, but rather abstractions that can be used without
  caring about the implementation details.
- `packages/core`: This directory contains all stateless and pure functions that
  can be re-used across the app.
- `packages/infrastructure`: This directory contains implementations of the services
  defined in `core-types`. For example, the specific implementation of the OneDrive
  media provider and its authentication service go here.
- `packages/infrastructure-bootstrap`: This package contains utility functions that
  can be used to bootstrap infrastructure services. For example, lazy loaders for
  media providers that orchestrate the importing and initialization of the services.

## Effect-specific

### Service definitions

Overall the app uses effect for pretty much everything. The `core-types` package
defines the interfaces for the services, most of the definitions are just effects
when they are operations with no input parameters or functions that return effects
when they do have an input. Examples of this are the [Authentication interface](./packages/core/types/src/services/authentication.ts) or the [MediaProvider interface](./packages/core/types/src/services/provider.ts).

## Dependency injection

Echo makes heavy usage of the dependency injection provided by Effect. Initially
I defined a context object that held all shared services, but it was quite cumbersome
to keep passing around and it required initializing all services at the beginning
of the app. Instead we now use the third type parameter of `Effect`, which declares
all the requirements that are needed to run a particular effect. This also makes
it really easy to make dependency injection type safe, since an effect without
all the required dependencies won't be able to run.

In order to keep a map of the dependencies, Effect requires all services to be tagged
with a unique identifier. In Echo, tags are usually defined at specific services instead
of abstract interfaces to be able to locate them individually. For example, there's
no `Authentication` tag, but rather an `MsalAuthentication` tag, since in order to
correctly use the OneDrive provider we need the MSAL-specific implementation of the
authentication service. However this is not a hard rule, and there are cases, like
the factory for media providers, where the tag is generalized. These tags are later
implemented via `Layers` to keep the dependency injection when constructing the
services instead of when running the effects. Examples of this are the [MsalAuthentication](./packages/infrastructure/onedrive-provider/src/msal-authentication.ts)
which implements the `Authentication` interface, and it's used later in the
[OneDriveProvider](./packages/infrastructure//onedrive-provider/src/onedrive-provider.ts)
and resolved inside the [same package](./packages/infrastructure/onedrive-provider/index.ts),
which then exports a layer that depends only on services and layers that could
not be resolved in the package directly. For example, the OneDrive provider requires
the app config object, which is bootstrapped in the `web` package.

## Factories

One recurring pattern in the app is the usage of factories to create services that
require external configuration. For example, in order to keep the media providers
safe from being initialized before the user has been properly authenticated,
the construction of media providers is hidden behind a factory that requires the
authentication info returned by the provider-specific authentication service.

## Pipe/Effect.gen

Across Echo you'll mostly find `Effect.gen` being used, and pipes only being used
when the effect is a single operation, since I found that it makes it more readable
once you get use to the generator syntax.
