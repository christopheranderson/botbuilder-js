const { ActivityTypes, ConversationState, MemoryStorage, TestAdapter,TranscriptLoggerMiddleware } = require('botbuilder-core');
const { UnitTestTranscriptLogger } = require('botbuilder');
const { DialogSet, Dialog, DialogTurnStatus } = require('../');
const assert = require('assert');
const path = require('path');

const beginMessage = { text: `begin`, type: 'message' };

class TestDialog extends Dialog {
    constructor(dialogId) {
        super(dialogId);
        this.beginArgs = undefined;
        this.continueCalled = false;
    }

    async beginDialog(dc, options) {
        assert(dc);
        if (options) {
            assert(options.test === 'test1', `received options and options.test ("${options.test}") was not "test1".`);
        }
        await dc.context.sendActivity('begin called');
        return Dialog.EndOfTurn;
    }

    async continueDialog(dc, options) {
        return await dc.endDialog(120);
    }
}

describe('Dialog', function () {
    this.timeout(5000);

    it('should call dialog from a dialog set using dc.beginDialog().', async function () {
        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            await dc.beginDialog('testDialog');
            await convoState.saveChanges(turnContext);
        }, TestAdapter.createConversation(this.test.title))
        .use(new TranscriptLoggerMiddleware(new UnitTestTranscriptLogger(path.join(__dirname,"transcripts"))));

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and register TestDialog.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const dialog = new TestDialog('testDialog');
        dialogs.add(dialog);

        await adapter.send(beginMessage)
            .assertReply('begin called');
    });

    it('should receive dialog options when beginning a dialog from a dialog set.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            await dc.beginDialog('testDialog', { test: 'test1' });
            await convoState.saveChanges(turnContext);
        }, TestAdapter.createConversation(this.test.title))
        .use(new TranscriptLoggerMiddleware(new UnitTestTranscriptLogger(path.join(__dirname,"transcripts"))));

        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const dialog = new TestDialog('testDialog');
        dialogs.add(dialog);

        await adapter.send(beginMessage)
            .assertReply('begin called');
    });

    it('should continue() a multi-turn dialog.', async function () {
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            switch (results.status) {
                case DialogTurnStatus.empty:
                    await dc.beginDialog('testDialog');
                    break;

                case DialogTurnStatus.complete:
                    const finalResult = results.result;
                    await turnContext.sendActivity(finalResult.toString());
                    break;
            }
            await convoState.saveChanges(turnContext);
        }, TestAdapter.createConversation(this.test.title))
        .use(new TranscriptLoggerMiddleware(new UnitTestTranscriptLogger(path.join(__dirname,"transcripts"))));


        const convoState = new ConversationState(new MemoryStorage());

        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        const dialog = new TestDialog('testDialog');
        dialogs.add(dialog);

        await adapter.send(beginMessage)
            .assertReply('begin called')
            .send('continue')
            .assertReply('120');
    });
});
