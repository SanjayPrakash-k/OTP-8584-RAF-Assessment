/**
 * @NApiVersion 2.1
 * @NScriptType UserEvent
 * @NModuleScope SameAccount
 */
/*************************************************************************************
 *
 *
 * ${OTP-8594-Raf Evaluation} : ${Sales Oder Transformation - RAF Assessment}
 *
 *
 **************************************************************************************
 *
 * Author: Jobin and Jismi IT Services
 *
 * Date Created : 25-June-2025
 *
 * Description : This script is for automate sales order by creating invoice. The 
 * invoice created only when item fulfillment record is created with shipment status as 
 * 'Shipped'.
 *
 *
 * REVISION HISTORY
 *
 * @version 1.0  :  25-June-2025:  The initial build was created by JJ0404
 *
 *
 *
 *************************************************************************************/
define(['N/record'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record, search) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            invoiceCreation(scriptContext);
        }

        /**
        * Function to create invoice if item is fulfilled. 
        * @param scriptContext
        */
        function invoiceCreation(scriptContext){
            let itemFulfillmentId;
            try{
                let newItemRecord = scriptContext.newRecord;

                if(scriptContext.newRecord.type === "itemfulfillment"){
                    let shipmentStatus = newItemRecord.getValue({ fieldId: 'shipstatus' });
                    itemFulfillmentId = newItemRecord.getValue({ fieldId: 'id' });
                    let lineCount = newItemRecord.getLineCount({ sublistId: 'item' });
                    let salesOrderId = newItemRecord.getValue('createdfrom');
                    let isInvoiceExist = newItemRecord.getValue('custbody_jj_invoice_status') || '';
                    
                    if(shipmentStatus === 'C' && isInvoiceExist == ''){
                        let invoice = record.transform({
                            fromType:'salesorder',
                            fromId: salesOrderId,
                            toType: 'invoice',
                        });

                        for(let i = 0; i<lineCount; i++){
                            let sublistItem = newItemRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });

                            let sublistItemQuantity = newItemRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            });
                            
                            invoice.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i,
                                value: sublistItem
                            });

                            invoice.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: sublistItemQuantity
                            });
                        }
                        
                        let createdInvoiceId = invoice.save();

                        if(createdInvoiceId){
                            record.submitFields({
                                type: 'itemfulfillment',
                                id: itemFulfillmentId,
                                values: {
                                    custbody_jj_invoice_status: createdInvoiceId
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                        }

                    } else {
                        log.debug('Not yet Shipped or invoice already created', shipmentStatus);
                    }
                }

            } catch(error) {
                log.error('Unexpected Error Occured While Creating Invoice', error.toString());

                record.submitFields({
                    type: 'itemfulfillment',
                    id: itemFulfillmentId,
                    values: {
                        custbody_jj_reason_to_fail: error.toString()
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
