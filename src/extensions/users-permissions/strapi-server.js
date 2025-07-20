const SteamStrategy = require('passport-steam').Strategy;

module.exports = (plugin) => {
  const providersService = plugin.services.providers;

  providersService.providers.push({
    uid: 'steam',
    displayName: 'Steam',
    icon: 'steam',
    createStrategy: () =>
      new SteamStrategy(
        {
          returnURL: process.env.STEAM_RETURN_URL,
          realm: process.env.STEAM_REALM,
          apiKey: process.env.STEAM_API_KEY,
        },
        async (identifier, profile, done) => {
          try {
            const steamId = profile.id;
            const email = `${steamId}@steam`;
            // найдём по полю steamId (его нужно добавить в модель, см. п.5)
            const existing = await strapi
              .query('plugin::users-permissions.user')
              .findOne({ where: { steamId } });

            if (existing) {
              return done(null, existing);
            }

            const newUser = await strapi.entityService.create(
              'plugin::users-permissions.user',
              {
                data: {
                  username: profile.displayName,
                  email,
                  provider: 'steam',
                  confirmed: true,
                  blocked: false,
                  steamId,
                  avatar: profile.photos?.[0]?.value || null,
                },
              }
            );
            done(null, newUser);
          } catch (err) {
            done(err);
          }
        }
      ),
  });

  return plugin;
};