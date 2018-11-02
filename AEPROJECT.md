# AEProject

**AEProject** is an aeternity framework which helps with setting up an project.
The framework is built in the JavaScript SDK and no additional installations are needed.

## Initialize AEProject

```
aeproject init
```

The **init** command creates aeternity project structure with a few folders in which the developer can create
the contracts, tests and deployment files and  scripts. Docker configuration files are also created, for easy use of the aeternity blockchain network.

## Compile sophia contracts
The **compile** command compiles sophia contract. Files should be with .aes file extension. Default directory is $projectDir/contracts.

## Run unit tests

```
aeproject test
```

The **test** command help developers run their unit tests for aeternity proejcts. The command executes the tests scripts that are located in the **test** folder
of your aeternity project.




