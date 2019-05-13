"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Settings", function() { 
  const fakeDialogOpts = [ { method: "showOpenDialog", value: ["/not/a/real/path"] } ];

  helpers.setupTimeout(this);

  let pickPrefsWindow = function() {
    return helpers.getWindowByTitle(app, "Before Dawn: Settings");
  };

  let currentPrefs = function() {
    return new SaverPrefs(workingDir);
  };

  beforeEach(function() {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir, true);
    return app.start().
              then(() => app.fakeDialog.mock(fakeDialogOpts)).
              then(() => app.client.waitUntilWindowLoaded() ).
              then(() => app.electron.ipcRenderer.send("open-prefs")).
              then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
              then(() => app.client.click("button.settings")).
              then(() => helpers.waitForWindow(app, "Before Dawn: Settings") );
    });

	afterEach(function() {
    return helpers.stopApp(app);
	});

  it("set general preferences", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => 
        app.client.selectByVisibleText("[name=delay]", "30 minutes")
      ).
      then(() => 
        app.client.selectByVisibleText("[name=\"sleep\"]", "15 minutes")
      ).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      // then(() => helpers.waitForWindowClosed(app, "Before Dawn: Settings")).
      then(function() {
        assert.equal(30, currentPrefs().delay);
        assert.equal(15, currentPrefs().sleep);
      });
  });

  it("toggles checkboxes", function() {
    let oldConfig = currentPrefs();

    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("label*=Lock screen after running")).
      then(() => app.client.click("label*=Disable when on battery?")).
      then(() => app.client.click("label*=Auto start on login?")).
      then(() => app.client.click("label*=Only run on the primary display?")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      // then(() => helpers.waitForWindowClosed(app, "Before Dawn: Settings")).
      then(function() {
        assert.equal(!oldConfig.lock, currentPrefs().lock);
        assert.equal(!oldConfig.disableOnBattery, currentPrefs().disableOnBattery);
        assert.equal(!oldConfig.auto_start, currentPrefs().auto_start);
        assert.equal(!oldConfig.runOnSingleDisplay, currentPrefs().runOnSingleDisplay);
      });
  });

  it("leaves checkboxes", function() {
    let oldConfig = currentPrefs();

    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      // then(() => helpers.waitForWindowClosed(app, "Before Dawn: Settings")).
      then(function() {
        assert.equal(oldConfig.lock, currentPrefs().lock);
        assert.equal(oldConfig.disableOnBattery, currentPrefs().disableOnBattery);
        assert.equal(oldConfig.auto_start, currentPrefs().auto_start);
        assert.equal(oldConfig.runOnSingleDisplay, currentPrefs().runOnSingleDisplay);
      });
  });
  
  it("allows setting path via dialog", function() {
    return pickPrefsWindow().
      then(() => app.client.click("button.pick")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      // then(() => helpers.waitForWindowClosed(app, "Before Dawn: Settings")).
      then(function() {
        assert.equal("/not/a/real/path", currentPrefs().localSource);
      });
  });

  it("clears localSource", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(function() {
        let ls = currentPrefs().localSource;
        assert( ls != "" && ls !== undefined);
      }).
      then(() => app.client.click("button.clear")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      // then(() => helpers.waitForWindowClosed(app, "Before Dawn: Settings")).
      then(function() {
        assert.equal("", currentPrefs().localSource);
      });
  });


  it("resets defaults", function() {
    const resetDialogOpts = [ { method: "showMessageBox", value: 1 } ];

    return pickPrefsWindow().
      then(() => app.fakeDialog.mock(resetDialogOpts)).
      then(() => app.client.click("button.reset-to-defaults")).
      then(() => app.client.waitUntilTextExists("body", "Settings reset")).
      then(function() {
        assert.equal("", currentPrefs().localSource);
      });
  });
});