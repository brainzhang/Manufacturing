import React from 'react';
import CreateBOMWizard from '../components/CreateBOMWizard';
import styles from '../components/CreateBOMWizard.module.css';

const CreateBOMWizardPage = () => {
  return (
    <div className={styles.createBOMWizard}>
      <CreateBOMWizard />
    </div>
  );
};

export default CreateBOMWizardPage;