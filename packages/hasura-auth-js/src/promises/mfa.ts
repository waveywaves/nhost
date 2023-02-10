import { InterpreterFrom } from 'xstate'

import { EnableMfadMachine } from '../machines'

import { ActionErrorState } from './types'

export interface GenerateQrCodeHandlerResult extends ActionErrorState {
  qrCodeDataUrl: string
  isGenerated: boolean
}

export interface GenerateQrCodeState extends GenerateQrCodeHandlerResult {
  isGenerating: boolean
}
export interface ActivateMfaHandlerResult extends ActionErrorState {
  isActivated: boolean
}

export interface ActivateMfaState extends ActivateMfaHandlerResult {
  isActivating: boolean
}

export const generateQrCodePromise = (service: InterpreterFrom<EnableMfadMachine>) =>
  new Promise<GenerateQrCodeHandlerResult>((resolve) => {
    service.send('GENERATE')
    service.onTransition((state) => {
      if (state.matches('generated')) {
        resolve({
          error: null,
          isError: false,
          isGenerated: true,
          qrCodeDataUrl: state.context.imageUrl || ''
        })
      } else if (state.matches({ idle: 'error' })) {
        resolve({
          error: state.context.error || null,
          isError: true,
          isGenerated: false,
          qrCodeDataUrl: ''
        })
      }
    })
  })
export const activateMfaPromise = (service: InterpreterFrom<EnableMfadMachine>, code: string) =>
  new Promise<ActivateMfaHandlerResult>((resolve) => {
    service.send('ACTIVATE', {
      activeMfaType: 'totp',
      code
    })
    service.onTransition((state) => {
      if (state.matches({ generated: 'activated' })) {
        resolve({ error: null, isActivated: true, isError: false })
      } else if (state.matches({ generated: { idle: 'error' } })) {
        resolve({ error: state.context.error, isActivated: false, isError: true })
      }
    })
  })
