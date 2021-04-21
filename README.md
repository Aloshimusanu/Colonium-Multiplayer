# Colonium-Multiplayer
An online multiplayer(and somewhat limited) version of the [Android Clonium](http://4pda.ru/forum/lofiversion/index.php?t632925.html) game.
<br>
[Rules](https://github.com/pier-bezuhoff/clonium/wiki/Rules-of-Clonium) (The link points to a wiki of another version of the same game)

# Installation
1. Install nodejs
2. Run `npm install` in repo folder
3. Start with `node .` in repo folder

# Usage
## Port config
The .env file contains two variables,
1. `internalPORT` specifies the port on the local machine to listen to.
2. `externalPORT` specifies the port on your router the game will try to forward to `internalPORT`.

## Playing

1. Open  localhost:`internalPORT`/config  , You will see the updating number of players currently connected, input the size of the map.
  (config is currently only available from localhost)
2. have your friends open the link outputted to the console by the game.
3. When the number of connected players reaches the number of your friends, press start.
