# How to connect wallet to æpp using æternity's JS SDK

## Introduction

In æternity ecosystem, the app that has access to user's private keys and grants other apps
access to them is called wallet. Respectively, the app that is granted access is called aepp.

This folder has been created to **showcase the æternity SDK integration** to both wallets and aepps.

## Setup info

If you are trying these examples after checking out this repo,
you want to first run `npm install`, from the repo root, to get all the SDK dependencies installed,
and only then, move to individual apps installations.

## Available examples

### 1. æpp

The Sample [æpp](aepp) project (Distributed App or dapp) shows how you can create a simple æternity æpp,
dependent on a Wallet, in this case: offering the possibility to work with contracts.

### 2. Wallet WebExtension

The [Wallet WebExtension](wallet-web-extension) example project shows how you can create a simple
æternity wallet as a Chrome/Firefox browser extension. This approach is actively used in
[Superhero Wallet](https://github.com/aeternity/superhero-wallet).

### 3. iframe-based wallet

The [wallet](wallet-iframe) example project shows how you can create a simple æternity wallet
that opens æpps in iframe. This approach is actively used in [Base æpp](https://github.com/aeternity/aepp-base).
